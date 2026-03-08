import { useState, useEffect } from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { User, Mail, Calendar, LogOut, Edit2, Save, X, Phone, Instagram, FileText, Loader2, Twitter, Linkedin, Github, Link as LinkIcon, Camera, Trash2, Hash, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import zxcvbn from "zxcvbn";
import { useToast } from "../context/ToastContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Profile() {
    useDocumentTitle("Profile");
    const { isLoggedIn, user, logout, jwt, updateUserState } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isEditing, setIsEditing] = useState(searchParams.get("editing") === "true");
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: user?.full_name || "",
        username: user?.username || "",
        bio: user?.bio || "",
        phone_number: user?.phone_number || ""
    });

    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        if (user) {
            setEditForm({
                full_name: user.full_name || "",
                username: user.username || "",
                bio: user.bio || "",
                phone_number: user.phone_number || ""
            });
        }
    }, [user]);

    useEffect(() => {
        if (!isEditing) return;

        if (!editForm.username || editForm.username.length < 5 || editForm.username.length > 20) {
            setUsernameAvailable(false);
            setIsCheckingUsername(false);
            return;
        }

        if (editForm.username === user?.username) {
            setUsernameAvailable(true);
            setIsCheckingUsername(false);
            return;
        }

        const checkAvailability = async () => {
            setIsCheckingUsername(true);
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/v1/auth/check-username?username=${editForm.username}`);
                if (response.ok) {
                    const data = await response.json();
                    setUsernameAvailable(data.available);
                }
            } catch (error) {
                console.error("Username check failed", error);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [editForm.username, isEditing, user?.username]);

    const startEditing = () => {
        setEditForm({
            full_name: user?.full_name || "",
            username: user?.username || "",
            bio: user?.bio || "",
            phone_number: user?.phone_number || ""
        });
        setIsEditing(true);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/auth/me/avatar", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${jwt}`
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to upload avatar");
            }

            const updatedData = await response.json();
            updateUserState(updatedData);
            addToast("Profile picture updated", "success");
        } catch (error) {
            console.error(error);
            addToast(error.message || "Failed to upload profile picture", "error");
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = null;
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({ profile_picture_url: "" })
            });

            if (!response.ok) throw new Error("Failed to remove avatar");

            const updatedData = await response.json();
            updateUserState(updatedData);
            addToast("Profile picture removed", "success");
        } catch (error) {
            console.error(error);
            addToast("Failed to remove profile picture", "error");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {

            if (passwordForm.current_password || passwordForm.new_password) {
                if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
                    throw new Error("Please fill out all password fields, or leave them entirely blank to keep your current password.");
                }
                if (passwordForm.new_password !== passwordForm.confirm_password) {
                    throw new Error("New passwords do not match");
                }

                setIsChangingPassword(true);
                const pwdResponse = await fetch("http://127.0.0.1:8000/api/v1/auth/password", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${jwt}`
                    },
                    body: JSON.stringify({
                        current_password: passwordForm.current_password,
                        new_password: passwordForm.new_password
                    })
                });

                if (!pwdResponse.ok) {
                    const errData = await pwdResponse.json();
                    let errMsg = "Failed to update password";
                    if (Array.isArray(errData.detail)) errMsg = errData.detail[0].msg;
                    else if (typeof errData.detail === 'string') errMsg = errData.detail;
                    throw new Error(errMsg);
                }
            }

            const response = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) {
                const errData = await response.json();
                let errMsg = "Failed to update profile";
                if (Array.isArray(errData.detail)) errMsg = errData.detail[0].msg;
                else if (typeof errData.detail === 'string') errMsg = errData.detail;
                throw new Error(errMsg);
            }

            const updatedData = await response.json();
            updateUserState(updatedData);

            setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
            setIsEditing(false);
            navigate('/profile', { replace: true });

            addToast("Profile updated successfully", "success");
        } catch (error) {
            console.error(error);
            const errBody = error.message === "Failed to fetch" ? "Network Error" : error.message;
            addToast(errBody || "Failed to save profile changes", "error");
        } finally {
            setIsSaving(false);
            setIsChangingPassword(false);
        }
    };

    if (!isLoggedIn || !user) {
        return (
            <div className="max-w-xl mx-auto text-center mt-20">
                <Card className="p-12 space-y-6">
                    <User size={64} className="mx-auto text-zinc-400" />
                    <h2 className="text-2xl font-bold">Unauthenticated</h2>
                    <p className="text-[var(--text-secondary)]">Please log in to view your profile.</p>
                    <Button onClick={() => navigate('/login')}>Go to Login</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">My Profile</h2>
                <p className="text-[var(--text-secondary)]">Manage your account information and statistics.</p>
            </div>

            <Card className="p-8 md:p-12 text-center md:text-left shadow-xl border-t-4 border-t-[var(--primary)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] opacity-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="flex flex-col items-center gap-3 shrink-0">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-orange-500/30 uppercase border-4 border-[var(--bg-surface)] overflow-hidden">
                                {isUploadingAvatar ? (
                                    <Loader2 className="animate-spin" size={32} />
                                ) : user.profile_picture_url ? (
                                    <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    (user.full_name || user.email || "U").charAt(0)
                                )}
                            </div>

                            {isEditing && (
                                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <label className="cursor-pointer text-white hover:text-[var(--primary)] transition-colors p-1" title="Upload Avatar">
                                        <Camera size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                    </label>
                                    {user.profile_picture_url && (
                                        <button onClick={handleRemoveAvatar} disabled={isUploadingAvatar} className="text-white hover:text-red-500 transition-colors p-1" title="Remove Avatar">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4 flex-1 w-full">
                        {!isEditing ? (
                            <>
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{user.full_name || "SignFusion User"}</h3>
                                        <button onClick={startEditing} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-full transition-colors" title="Edit Profile">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-3">
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-secondary)]">
                                            <Hash size={16} className="text-[var(--primary)]" />
                                            <span className="font-mono text-sm font-semibold">{user.username || user.id || user._id}</span>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-secondary)]">
                                            <Mail size={16} className="text-zinc-400" />
                                            <span>{user.email}</span>
                                        </div>
                                        {user.phone_number && (
                                            <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-secondary)]">
                                                <Phone size={16} className="text-zinc-400" />
                                                <span>{user.phone_number}</span>
                                            </div>
                                        )}
                                        {user.bio && (
                                            <div className="flex items-start justify-center md:justify-start gap-2 text-[var(--text-secondary)] mt-2">
                                                <FileText size={16} className="text-zinc-400 mt-1 shrink-0" />
                                                <p className="max-w-md text-sm italic">"{user.bio}"</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-secondary)] mt-1">
                                            <Calendar size={16} className="text-zinc-400" />
                                            <span className="text-xs uppercase tracking-wider font-semibold">Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 justify-center md:justify-start pt-4 border-t border-[var(--border-color)]">
                                    <Button variant="outline" onClick={() => navigate('/settings')}>Preferences</Button>
                                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => { logout(); navigate('/'); }}>
                                        <LogOut size={16} className="mr-2" /> Logout
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 bg-[var(--bg-background)] p-6 rounded-xl border border-[var(--border-color)] animate-in fade-in duration-300">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block flex justify-between">
                                            <span>Username</span>
                                            {isCheckingUsername ? (
                                                <span className="flex items-center gap-1 text-zinc-400"><Loader2 size={12} className="animate-spin" /> Checking</span>
                                            ) : usernameAvailable === true ? (
                                                <span className="flex items-center gap-1 text-green-500"><Check size={12} /> Available</span>
                                            ) : usernameAvailable === false ? (
                                                <span className="flex items-center gap-1 text-red-500">
                                                    <X size={12} />
                                                    {(!editForm.username || editForm.username.length < 5 || editForm.username.length > 20)
                                                        ? '5-20 Chars'
                                                        : 'Unavailable'}
                                                </span>
                                            ) : null}
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={20}
                                            minLength={5}
                                            className={`w-full bg-[var(--bg-surface)] border ${usernameAvailable === false ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border-color)] focus:ring-[var(--primary)]'} rounded-lg px-4 py-2 focus:ring-2 outline-none transition-colors`}
                                            value={editForm.username}
                                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Email</label>
                                        <input
                                            type="email"
                                            readOnly
                                            className="w-full bg-zinc-100 dark:bg-zinc-800 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-2 outline-none cursor-not-allowed"
                                            value={user.email}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                            placeholder="Mobile Number"
                                            value={editForm.phone_number}
                                            onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        { }
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Bio</label>
                                    <textarea
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none h-24"
                                        placeholder="Tell us a bit about yourself..."
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    />
                                </div>
                                <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Change Password</h3>
                                    <div className="space-y-4 bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Current Password</label>
                                            <input
                                                type="password"
                                                className="w-full bg-[var(--bg-background)] border border-[var(--border-color)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                                                value={passwordForm.current_password}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? "text" : "password"}
                                                        className="w-full bg-[var(--bg-background)] border border-[var(--border-color)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all pr-10"
                                                        value={passwordForm.new_password}
                                                        onChange={(e) => {
                                                            setPasswordForm({ ...passwordForm, new_password: e.target.value });
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-[var(--text-primary)] transition-colors"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                    >
                                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>

                                                { }
                                                {passwordForm.new_password && (
                                                    <div className="mt-2 text-xs">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-zinc-500">Security Requirement:</span>
                                                            <span className={zxcvbn(passwordForm.new_password).score > 2 ? 'text-green-500' : 'text-orange-500'}>
                                                                {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][zxcvbn(passwordForm.new_password).score]}
                                                            </span>
                                                        </div>
                                                        <ul className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-zinc-500 uppercase font-semibold text-[10px]">
                                                            <li className={`flex items-center gap-1 ${passwordForm.new_password.length >= 8 ? 'text-green-500' : ''}`}>
                                                                {passwordForm.new_password.length >= 8 ? <Check size={10} /> : <X size={10} />} 8+ Chars
                                                            </li>
                                                            <li className={`flex items-center gap-1 ${/[A-Z]/.test(passwordForm.new_password) ? 'text-green-500' : ''}`}>
                                                                {/[A-Z]/.test(passwordForm.new_password) ? <Check size={10} /> : <X size={10} />} UPPERCASE
                                                            </li>
                                                            <li className={`flex items-center gap-1 ${/[a-z]/.test(passwordForm.new_password) ? 'text-green-500' : ''}`}>
                                                                {/[a-z]/.test(passwordForm.new_password) ? <Check size={10} /> : <X size={10} />} LOWERCASE
                                                            </li>
                                                            <li className={`flex items-center gap-1 ${/[0-9]/.test(passwordForm.new_password) ? 'text-green-500' : ''}`}>
                                                                {/[0-9]/.test(passwordForm.new_password) ? <Check size={10} /> : <X size={10} />} NUMBER
                                                            </li>
                                                            <li className={`flex items-center gap-1 col-span-2 ${/[@$!%*?&]/.test(passwordForm.new_password) ? 'text-green-500' : ''}`}>
                                                                {/[@$!%*?&]/.test(passwordForm.new_password) ? <Check size={10} /> : <X size={10} />} SPECIAL CHAR (@$!%*?&)
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 block">Confirm New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        className="w-full bg-[var(--bg-background)] border border-[var(--border-color)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all pr-10"
                                                        value={passwordForm.confirm_password}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-[var(--text-primary)] transition-colors"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-4">
                                    <Button variant="ghost" onClick={() => { setIsEditing(false); setPasswordForm({ current_password: "", new_password: "", confirm_password: "" }); }} disabled={isSaving || isChangingPassword} className="text-[var(--text-secondary)]">
                                        <X size={16} className="mr-1" /> Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={isSaving || isChangingPassword || usernameAvailable === false}>
                                        {isSaving || isChangingPassword ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="p-6 text-center space-y-2">
                    <h4 className="text-[var(--text-secondary)] font-medium">Translations</h4>
                    <p className="text-4xl font-bold text-[var(--primary)]">12</p>
                </Card>
                <Card className="p-6 text-center space-y-2">
                    <h4 className="text-[var(--text-secondary)] font-medium">Saved Items</h4>
                    <p className="text-4xl font-bold text-[var(--primary)]">4</p>
                </Card>
                <Card className="p-6 text-center space-y-2">
                    <h4 className="text-[var(--text-secondary)] font-medium">Current Plan</h4>
                    <p className="text-2xl font-bold text-green-500 pt-1">Free</p>
                </Card>
            </div>
        </div>
    );
}
