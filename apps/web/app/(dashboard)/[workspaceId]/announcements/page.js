'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import {
  Bell,
  File,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Pin,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/Can';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { MentionInput } from '@/components/ui/MentionInput';
import { MentionText } from '@/components/ui/Mention';
import { api } from '@/lib/api';
import { useAnnouncementsStore } from '@/stores/announcementsStore';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const RichEditor = dynamic(
  () => import('@/components/ui/RichEditor').then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[160px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-subtle">
        Loading editor…
      </div>
    ),
  }
);

const reactionOptions = [
  { label: '👍', value: 'THUMBS_UP' },
  { label: '🎯', value: 'TARGET' },
  { label: '🔥', value: 'FIRE' },
];

const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function fileIcon(type = '') {
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf' || type.includes('document') || type.includes('text/'))
    return FileText;
  return File;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AnnouncementsPage({ params }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]); // { id, name, size, type, progress, url, publicId, uploading, error }
  const [commentDrafts, setCommentDrafts] = useState({});
  const fileInputRef = useRef(null);

  const items = useAnnouncementsStore((state) => state.items);
  const fetchAnnouncements = useAnnouncementsStore((state) => state.fetchAnnouncements);
  const createAnnouncement = useAnnouncementsStore((state) => state.create);
  const toggleReaction = useAnnouncementsStore((state) => state.toggleReaction);
  const addComment = useAnnouncementsStore((state) => state.addComment);
  const togglePin = useAnnouncementsStore((state) => state.togglePin);

  const currentUser = useAuthStore((state) => state.user);
  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const members = (workspace?.memberships || []).map((m) => m.user).filter(Boolean);

  useEffect(() => {
    fetchAnnouncements(params.workspaceId).catch(() =>
      toast.error('Could not load announcements')
    );
  }, [fetchAnnouncements, params.workspaceId]);

  const uploadingAny = attachments.some((a) => a.uploading);

  function updateAttachment(id, patch) {
    setAttachments((list) =>
      list.map((att) => (att.id === id ? { ...att, ...patch } : att))
    );
  }

  async function startUpload(file) {
    const id = `${file.name}_${file.lastModified}_${Math.random().toString(36).slice(2, 8)}`;
    const placeholder = {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      progress: 0,
      uploading: true,
      url: null,
      publicId: null,
      error: null,
    };
    setAttachments((list) => [...list, placeholder]);

    try {
      const signature = await api.post('/uploads/signature', { folder: 'attachments' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', String(signature.timestamp));
      formData.append('signature', signature.signature);
      if (signature.folder) formData.append('folder', signature.folder);

      const payload = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          'POST',
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`
        );
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            updateAttachment(id, { progress: pct });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Upload failed (HTTP ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      updateAttachment(id, {
        uploading: false,
        progress: 100,
        url: payload.secure_url,
        publicId: payload.public_id,
      });
    } catch (error) {
      updateAttachment(id, {
        uploading: false,
        error: error.message || 'Upload failed',
      });
      toast.error(`${file.name}: ${error.message || 'Upload failed'}`);
    }
  }

  function handleAttachInput(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`Max ${MAX_ATTACHMENTS} attachments`);
      return;
    }

    for (const file of files.slice(0, remaining)) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      startUpload(file);
    }
  }

  async function removeAttachment(id) {
    const target = attachments.find((a) => a.id === id);
    setAttachments((list) => list.filter((a) => a.id !== id));
    if (target?.publicId) {
      // Best-effort cleanup. We don't have a destroy endpoint client-side,
      // so we leave the orphan if needed — deleteFile is server-side only.
      // (Avoids exposing api_secret to the client.)
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Add a title and message');
      return;
    }
    if (uploadingAny) {
      toast.error('Wait for attachments to finish uploading');
      return;
    }

    const ready = attachments
      .filter((a) => a.url && a.publicId && !a.error)
      .map((a) => ({
        url: a.url,
        publicId: a.publicId,
        name: a.name,
        size: a.size,
        type: a.type,
      }));

    try {
      await createAnnouncement(params.workspaceId, {
        title: title.trim(),
        contentHtml: content,
        attachments: ready,
      });
      setTitle('');
      setContent('');
      setAttachments([]);
      toast.success('Announcement posted');
    } catch (error) {
      toast.error(error.message || 'Could not create announcement');
    }
  }

  async function handleComment(announcementId) {
    const draft = commentDrafts[announcementId];
    if (!draft) return;
    try {
      await addComment(params.workspaceId, announcementId, draft);
      setCommentDrafts((s) => ({ ...s, [announcementId]: '' }));
    } catch (error) {
      toast.error(error.message || 'Could not add comment');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-fg">
          Announcements <span className="font-normal text-muted">· {items.length}</span>
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Decisions, status updates, and notes the whole team should see.
        </p>
      </div>

      <Can action="announcement:create">
        <form onSubmit={handleCreate} className="rounded-lg glass-panel">
          <div className="border-b border-divider p-3">
            <Input
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 px-0 text-md font-medium shadow-none placeholder:text-subtle focus:shadow-none"
            />
          </div>
          <div className="p-3">
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Share an update with your team… use the toolbar for formatting."
              className="border-0 bg-transparent"
            />
          </div>

          {attachments.length > 0 && (
            <ul className="space-y-1.5 border-t border-divider px-3 py-2">
              {attachments.map((att) => {
                const Icon = fileIcon(att.type);
                return (
                  <li
                    key={att.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg">{att.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted">
                        <span>{formatBytes(att.size)}</span>
                        {att.uploading && (
                          <span className="inline-flex items-center gap-1 text-accent">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {att.progress}%
                          </span>
                        )}
                        {att.error && (
                          <span className="text-[color:var(--danger)]">{att.error}</span>
                        )}
                        {!att.uploading && !att.error && (
                          <span className="text-[color:var(--success)]">Ready</span>
                        )}
                      </div>
                      {att.uploading && (
                        <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-surfaceHover">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${att.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      aria-label="Remove attachment"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:bg-surfaceHover hover:text-fg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-divider px-3 py-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted transition-colors hover:bg-surfaceHover hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach files
              <span className="text-2xs text-subtle">
                ({attachments.length}/{MAX_ATTACHMENTS})
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
              onChange={handleAttachInput}
            />
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || uploadingAny}
              size="sm"
            >
              <Send className="h-3.5 w-3.5" />
              Post
            </Button>
          </div>
        </form>
      </Can>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements yet"
          body="Use this space for launch notes, decisions, meeting recaps."
        />
      ) : (
        <div className="space-y-3">
          {items.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              workspaceId={params.workspaceId}
              members={members}
              currentUserId={currentUser?.id}
              commentDraft={commentDrafts[announcement.id] || ''}
              onCommentDraftChange={(value) =>
                setCommentDrafts((s) => ({ ...s, [announcement.id]: value }))
              }
              onSubmitComment={() => handleComment(announcement.id)}
              onToggleReaction={(value) =>
                toggleReaction(params.workspaceId, announcement.id, value).catch(() => {})
              }
              onTogglePin={() =>
                togglePin(params.workspaceId, announcement.id, !announcement.pinned).catch(
                  () => {}
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="mx-4 mb-3 flex flex-wrap gap-1.5">
      {attachments.map((att, i) => {
        const Icon = fileIcon(att.type || '');
        return (
          <a
            key={att.publicId || `${att.url}_${i}`}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-fgMuted transition-colors hover:border-borderStrong hover:bg-surfaceHover"
            title={att.name || ''}
          >
            <Icon className="h-3 w-3 shrink-0 text-muted" />
            <span className="truncate max-w-[180px]">{att.name || 'Attachment'}</span>
            {att.size && <span className="text-2xs text-subtle">{formatBytes(att.size)}</span>}
          </a>
        );
      })}
    </div>
  );
}

function AnnouncementCard({
  announcement,
  members,
  currentUserId,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  onToggleReaction,
  onTogglePin,
}) {
  return (
    <article
      className={clsx(
        'rounded-lg glass-panel',
        announcement.pinned && 'border-borderStrong'
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            size="md"
            name={announcement.author?.displayName}
            src={announcement.author?.avatarUrl}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-fg">{announcement.title}</h3>
              {announcement.pinned && (
                <Badge tone="accent" className="gap-1">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              <span className="font-medium text-fgMuted">
                {announcement.author?.displayName || 'Unknown'}
              </span>
              <span className="mx-1.5 text-subtle">·</span>
              {new Date(announcement.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Can action="announcement:pin">
          <Button onClick={onTogglePin} variant="ghost" size="sm">
            <Pin className="h-3.5 w-3.5" />
            {announcement.pinned ? 'Unpin' : 'Pin'}
          </Button>
        </Can>
      </header>

      <div
        className="prose-content px-4 py-3 text-sm leading-6 text-fgMuted [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-borderStrong [&_blockquote]:pl-3 [&_blockquote]:text-fgMuted [&_h1]:text-base [&_h1]:font-semibold [&_h1]:my-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: announcement.contentHtml }}
      />

      <AttachmentList attachments={announcement.attachments} />

      <div className="flex items-center gap-1 border-t border-divider px-3 py-2">
        {reactionOptions.map(({ label, value }) => {
          const count = announcement.reactions.filter((r) => r.emoji === value).length;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggleReaction(value)}
              className={clsx(
                'inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs transition-colors',
                count > 0
                  ? 'bg-accentSoft text-accent'
                  : 'text-muted hover:bg-surfaceHover hover:text-fg'
              )}
            >
              <span>{label}</span>
              {count > 0 && <span className="font-medium">{count}</span>}
            </button>
          );
        })}
      </div>

      {(announcement.comments || []).length > 0 && (
        <div className="space-y-3 border-t border-divider px-4 py-3">
          {(announcement.comments || []).map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Avatar
                size="sm"
                name={comment.author?.displayName}
                src={comment.author?.avatarUrl}
              />
              <div className="min-w-0 flex-1 rounded-md bg-surfaceSoft px-3 py-2">
                <MentionText
                  text={comment.content}
                  currentUserId={currentUserId}
                  className="text-sm leading-6 text-fg"
                />
                <p className="mt-0.5 text-xs text-muted">
                  <span className="font-medium text-fgMuted">
                    {comment.author?.displayName || 'Unknown'}
                  </span>
                  <span className="mx-1.5 text-subtle">·</span>
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-divider p-3">
        <MentionInput
          value={commentDraft}
          onChange={onCommentDraftChange}
          onSubmit={onSubmitComment}
          members={members}
          placeholder="Reply… type @ to mention a teammate"
        />
        <Button onClick={onSubmitComment} disabled={!commentDraft.trim()} size="sm">
          Reply
        </Button>
      </div>
    </article>
  );
}
