'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    api
      .get('/users/me')
      .then((user) => {
        setProfile(user);
        setDisplayName(user.displayName);
      })
      .catch((error) => toast.error(error.message || 'Could not load profile'));
  }, []);

  async function saveProfile(nextPatch) {
    setSaving(true);
    try {
      const user = await api.patch('/users/me', nextPatch);
      setProfile(user);
      setDisplayName(user.displayName);
      setAuthUser(user);
      toast.success('Profile updated');
      return user;
    } catch (error) {
      toast.error(error.message || 'Could not update profile');
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Update your display name." />

      <section className="rounded-lg glass-panel p-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3">
            <Avatar size="xl" name={profile?.displayName} src={profile?.avatarUrl} />
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
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
