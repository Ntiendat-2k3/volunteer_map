import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiEdit2,
  FiTrash2,
  FiCornerDownRight,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { commentApi } from "../../services/commentApi";

function fmt(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "U").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DisplayName({ u, fallback }) {
  const name = u?.name || u?.email || fallback;
  return <span className="font-semibold text-slate-900 truncate">{name}</span>;
}

export default function PostCommentsDrawer({ post }) {
  const { user } = useAuth();
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [tree, setTree] = useState([]);
  const [total, setTotal] = useState(0);

  // input bottom
  const [text, setText] = useState("");

  // replying / editing
  const [replyTarget, setReplyTarget] = useState(null); // node
  const [editTarget, setEditTarget] = useState(null); // node

  const isOwner = !!user && Number(user.id) === Number(post.userId);
  const isAdmin = user?.role === "ADMIN";
  const canComment = post.approvalStatus === "APPROVED";

  const load = async () => {
    setBusy(true);
    try {
      const res = await commentApi.list(post.id, { limit: 500 });
      setTree(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không tải được bình luận");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id, user?.id, user?.role]);

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => {
    setOpen(false);
    setText("");
    setReplyTarget(null);
    setEditTarget(null);
  };

  const startReply = (node) => {
    if (!user) {
      toast.error("Đăng nhập để trả lời");
      nav("/login");
      return;
    }
    setReplyTarget(node);
    setEditTarget(null);
    setText("");
  };

  const startEdit = (node) => {
    setEditTarget(node);
    setReplyTarget(null);
    setText(node.content || "");
  };

  const canEdit = (node) => {
    if (!user) return false;
    if (node.isDeleted) return false;
    return isAdmin || Number(node.userId) === Number(user.id);
  };

  const submit = async () => {
    const v = text.trim();
    if (!v) return toast.error("Bạn chưa nhập nội dung");

    if (!user) {
      toast.error("Hãy đăng nhập để bình luận");
      nav("/login");
      return;
    }
    if (!canComment) {
      toast.error("Bài chưa được duyệt nên chưa thể bình luận");
      return;
    }

    setBusy(true);
    try {
      if (editTarget) {
        await commentApi.update(post.id, editTarget.id, { content: v });
        toast.success("Đã cập nhật ✅");
        setEditTarget(null);
        setText("");
      } else {
        await commentApi.create(post.id, {
          content: v,
          parentId: replyTarget ? replyTarget.id : null,
        });
        toast.success("Đã gửi ✅");
        setReplyTarget(null);
        setText("");
      }
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không thực hiện được");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (node) => {
    const ok = window.confirm(
      "Xóa bình luận này? (Thread vẫn giữ, nội dung sẽ ẩn)"
    );
    if (!ok) return;
    setBusy(true);
    try {
      await commentApi.remove(post.id, node.id);
      toast.success("Đã xóa ✅");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không xóa được");
    } finally {
      setBusy(false);
    }
  };

  const modeLabel = useMemo(() => {
    if (editTarget) return "Đang sửa bình luận";
    if (replyTarget) return "Đang trả lời";
    return null;
  }, [editTarget, replyTarget]);

  const placeholder = useMemo(() => {
    if (editTarget) return "Sửa bình luận...";
    if (replyTarget) return "Nhập trả lời...";
    return "Thêm bình luận...";
  }, [editTarget, replyTarget]);

  const Badge = ({ node }) => {
    if (Number(node.userId) === Number(post.userId))
      return <span className="badge">Chủ bài</span>;
    if (node.user?.role === "ADMIN")
      return <span className="badge">Admin</span>; // nếu backend có trả role
    return null;
  };

  const CommentNode = ({ node, depth }) => {
    const name = node.user?.name || node.user?.email || `User #${node.userId}`;

    return (
      <div className="flex gap-3" style={{ marginLeft: depth * 14 }}>
        <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
          {initials(name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <DisplayName u={node.user} fallback={`User #${node.userId}`} />
            <Badge node={node} />
            <div className="text-xs text-slate-500">{fmt(node.createdAt)}</div>
          </div>

          <div className="mt-1 text-slate-800 whitespace-pre-wrap break-words">
            {node.isDeleted ? (
              <span className="text-slate-500 italic">[đã xóa]</span>
            ) : (
              node.content
            )}
          </div>

          {/* actions nhỏ gọn */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="btn btn-outline"
              disabled={busy}
              type="button"
              onClick={() => startReply(node)}
            >
              <FiCornerDownRight /> Trả lời
            </button>

            {canEdit(node) && (
              <>
                <button
                  className="btn btn-outline"
                  disabled={busy}
                  type="button"
                  onClick={() => startEdit(node)}
                >
                  <FiEdit2 /> Sửa
                </button>
                <button
                  className="btn btn-outline"
                  disabled={busy}
                  type="button"
                  onClick={() => remove(node)}
                >
                  <FiTrash2 /> Xóa
                </button>
              </>
            )}
          </div>

          {/* replies */}
          {node.replies?.length > 0 && (
            <div className="mt-3 space-y-3">
              {node.replies.map((r) => (
                <CommentNode
                  key={r.id}
                  node={r}
                  depth={Math.min(depth + 1, 6)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <button type="button" className="btn btn-outline" onClick={openDrawer}>
        <FiMessageCircle /> Bình luận ({total})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute inset-0" onClick={closeDrawer} />

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl bg-white shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="font-extrabold text-slate-900">
                Bình luận • {total}
              </div>
              <button
                className="btn btn-outline"
                onClick={closeDrawer}
                disabled={busy}
              >
                <FiX /> Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {tree.length === 0 ? (
                <div className="text-sm text-slate-600">
                  Chưa có bình luận nào.
                </div>
              ) : (
                tree.map((node) => (
                  <CommentNode key={node.id} node={node} depth={0} />
                ))
              )}
            </div>

            <div className="border-t border-slate-200 p-3 bg-white">
              {modeLabel && (
                <div className="mb-2 text-xs text-slate-600 flex items-center justify-between">
                  <div className="truncate">
                    {modeLabel}
                    {replyTarget
                      ? `: ${
                          replyTarget.user?.name ||
                          replyTarget.user?.email ||
                          "người dùng"
                        }`
                      : ""}
                  </div>
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setReplyTarget(null);
                      setEditTarget(null);
                      setText("");
                    }}
                  >
                    Hủy
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={placeholder}
                  disabled={busy}
                />
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  type="button"
                  onClick={submit}
                >
                  <FiSend />
                </button>
              </div>

              {!user && (
                <div className="mt-2 text-xs text-slate-500">
                  Đăng nhập để bình luận / trả lời.
                </div>
              )}
              {!canComment && (
                <div className="mt-2 text-xs text-slate-500">
                  Bài chưa được duyệt nên chưa thể bình luận.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
