import React, {useState, useEffect, useCallback, useRef} from 'react'
import styles from '../stylesheets/contact.module.css'
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useAuthStore } from '../store/useAuthStore';

const Profile = () => {
  const { user, logout,  updateProfile } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [files, setFiles] = useState([]);
  const inputFileRef = useRef(null);
  const dropRef = useRef(null);

  // ---- form state
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    confirmPassword: ""
  });

  // keep form in sync if store user changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || ""
    }));
  }, [user]);

  // ===== Drag & drop helpers
  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const list = e.dataTransfer?.files;
    if (!list || list.length === 0) return;
    addFiles(list);
  }, []);

  const onPaste = useCallback((e) => {
    const list = e.clipboardData?.files;
    if (!list || list.length === 0) return;
    addFiles(list);
  }, []);

  const addFiles = useCallback((fileList) => {
    const arr = Array.from(fileList);
    const maxSizeMB = 10; // per file
    const accepted = arr.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    const rejected = arr.filter((f) => f.size > maxSizeMB * 1024 * 1024);
    if (rejected.length) {
      toast.error(`Some files exceeded ${maxSizeMB} MB and were skipped.`);
    }
    setFiles((prev) => {
      // limit to 5 attachments to keep request small
      const next = [...prev, ...accepted].slice(0, 5);
      return dedupeFiles(next);
    });
  }, []);

  const dedupeFiles = (arr) => {
    const seen = new Set();
    return arr.filter((f) => {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener("dragover", prevent);
    el.addEventListener("drop", onDrop);
    el.addEventListener("paste", onPaste);
    return () => {
      el.removeEventListener("dragover", prevent);
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("paste", onPaste);
    };
  }, [onDrop, onPaste]);

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSelectClick = () => {
    inputFileRef.current?.click();
  };

  const togglePasswordVisible = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  // ====== handlers you asked for
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
  e?.preventDefault?.();

  if (!formData.username?.trim()) return toast.error("Username is required.");
  if (!formData.email?.trim()) return toast.error("Email is required.");
  if (formData.password && formData.password !== formData.confirmPassword) {
    return toast.error("Passwords do not match.");
  }

  const payload = new FormData();
  payload.append("username", formData.username.trim());
  payload.append("email", formData.email.trim());
  payload.append("phone", formData.phone?.toString()?.trim() || "");
  if (formData.password) payload.append("password", formData.password);
  files.forEach((f) => payload.append("files", f, f.name));

  try {
    await toast.promise(
      updateProfile(payload),
      { loading: "Saving…", success: "Profile updated.", error: (e) => e?.message || "Failed to update profile." }
    );
    setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    setFiles([]);
  } catch (err) {
    // already surfaced via toast.promise; keep for debugging
    console.error(err);
  }
}, [files, formData, updateProfile]);

  return (
    <div className={styles.contactBg}>
      <Toaster position="top-right" />
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbItem}>Home</Link>
          <Icon icon="material-symbols-light:keyboard-arrow-right" className={styles.breadcrumbIcon} />
          <span className={styles.active}>{"Your Profile"}</span>
        </div>

        <div className={styles.contactContainer}>
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.contactTop}>
              <div className={styles.inpBg}>
                <label htmlFor="username" className={styles.label}>Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className={styles.inp}
                  placeholder={user ? user?.username : "Your name"}
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inpBg}>
                <label htmlFor="email" className={styles.label}>email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={styles.inp}
                  placeholder={user ? user?.email : "you@example.com"}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inpBg}>
                <label htmlFor="phone" className={styles.label}>Phone No.</label>
                <input
                  type="number"
                  id="phone"
                  name="phone"
                  className={styles.inp}
                  placeholder={user ? user?.phone : "Your Phone No."}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.contactTop}>
              <div className={styles.inpBg}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={styles.inp}
                  placeholder={"New Password"}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisible}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className={styles.toggleBtn}
                >
                  <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
              </div>

              <div className={`${styles.inpBg} m-0 ms-sm-4`} style={{ marginLeft: '40px' }}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={styles.inp}
                  placeholder={"Confirm New Password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisible}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className={styles.toggleBtn}
                >
                  <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
              </div>

              <div className={`${styles.cbRight} m-0 ms-sm-4 mt-5 mt-sm-0`} style={{ width: '90%', height: '100%' }}>
                <label htmlFor="addFile" className={styles.label}>Profile Image</label>
                <div ref={dropRef} className={styles.addFileBg} >
                  <div className={styles.addFile2}>
                    <Icon icon="line-md:folder" className={styles.addFileIcon} />
                    <p className={styles.addFileInfo}>Drop image here, paste or</p>
                    <button className={styles.select} type="button" onClick={onSelectClick}>
                      <Icon icon="basil:plus-outline" className={styles.plus} />
                      Select
                    </button>
                    <input
                      ref={inputFileRef}
                      id="addFile"
                      type="file"
                      accept="image/*,application/pdf,.txt,.doc,.docx,.zip"
                      multiple
                      hidden
                      onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />
                  </div>
                  {files.length > 0 && (
                    <ul className={styles.fileList}>
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className={styles.fileItem}>
                          <span className={styles.fileName}>{f.name}</span>
                          <button
                            type="button"
                            className={styles.removeFileBtn}
                            onClick={() => removeFile(i)}
                            title="Remove"
                          >
                            <Icon icon="mdi:close" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </form>

          <div className={styles.profileBtnBg}>
            <button className={styles.send} type="button" onClick={handleSubmit}>
              <Icon icon="ic:baseline-save" className={styles.sendIcon} />
              Update
            </button>
            <button className={styles.send} onClick={logout}>
              <Icon icon="line-md:logout" className={styles.sendIcon} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile;
