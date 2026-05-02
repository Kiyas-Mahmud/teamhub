'use client';

import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const { uploadFile, uploading, progress } = useCloudinaryUpload();

  useEffect(() => {
    api
      .get('/users/me')
      .then((user) => {
        setProfile(user);
        setDisplayName(user.displayName);
      })
      .catch((error) => toast.error(error.message || 'Could not load profile'));
  }, []);

  async function saveProfile(nextPatch, { showToast = true } = {}) {
    setSaving(true);
    try {
      const user = await api.patch('/users/me', nextPatch);
      setProfile(user);
      setDisplayName(user.displayName);
      setAuthUser(user);
      if (showToast) toast.success('Profile updated');
      return user;
    } catch (error) {
      toast.error(error.message || 'Could not update profile');
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image is too large — max 2MB');
      return;
    }

    // Optimistic preview while upload runs
    const previewUrl = URL.createObjectURL(file);
    const previousAvatar = profile?.avatarUrl;
    setProfile((p) => (p ? { ...p, avatarUrl: previewUrl } : p));

    try {
      const upload = await uploadFile(file, { folder: 'avatars' });
      await saveProfile(
        { avatarUrl: upload.url, avatarPublicId: upload.publicId },
        { showToast: false }
      );
      toast.success('Avatar updated');
    } catch (error) {
      setProfile((p) => (p ? { ...p, avatarUrl: previousAvatar } : p));
      toast.error(error.message || 'Could not upload avatar');
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Update your display name and avatar." />

      <section className="rounded-lg glass-panel p-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar size="xl" name={profile?.displayName} src={profile?.avatarUrl} />
              <label className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:bg-surfaceHover hover:text-fg">
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading ? (
              <div className="w-32">
                <div className="h-1 overflow-hidden rounded-full bg-surfaceHover">
                  <div
                    className="h-full bg-accent transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-2xs text-muted">Uploading {progress}%</p>
              </div>
            ) : (
              <p className="text-xs text-muted">PNG, JPG, GIF · max 2MB</p>
            )}
          </div>

          <form
            className="flex-1 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveProfile({ displayName });
            }}
          >
            <FormField label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </FormField>

            <FormField label="Email" hint="Email is locked once your account is created.">
              <Input disabled value={profile?.email || ''} />
            </FormField>

            <div className="pt-2">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
