import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../stylesheets/contact.module.css";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";

// ===== Validation schema
const schema = z.object({
  subject: z.string().min(3, "Subject is too short"),
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  message: z
    .string()
    .min(10, "Message should be at least 10 characters")
    .max(5000, "Message is too long"),
  // optional honeypot field to deter bots
  hp: z.string().max(0).optional().or(z.literal("")),
});

export default function Contact() {
  const [files, setFiles] = useState([]); // File[]
  const [submitting, setSubmitting] = useState(false);
  const inputFileRef = useRef(null);
  const dropRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({ resolver: zodResolver(schema) });

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

  // ===== Submission using Web3Forms (free, no backend). Add your key to .env as VITE_WEB3FORMS_KEY
  const onSubmit = async (values) => {
    const accessKey = 'cca39bcf-69e3-4692-92e2-114d4a68ab0c';
    if (!accessKey) {
      toast.error("Missing Web3Forms access key. Define VITE_WEB3FORMS_KEY in your .env.");
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("access_key", accessKey);
      formData.append("subject", values.subject);
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("message", values.message);
      formData.append("from_name", values.name);
      formData.append("botcheck", values.hp || "");
      files.forEach((f, i) => formData.append(`attachments`, f, f.name));

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Thanks! Your message has been sent.");
        reset();
        setFiles([]);
      } else {
        throw new Error(data?.message || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Something went wrong: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.contactBg}>
      <Toaster position="top-right" />
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbItem}>Home</Link>
          <Icon icon="material-symbols-light:keyboard-arrow-right" className={styles.breadcrumbIcon} />
          <span className={styles.active}>{"Contact Us"}</span>
        </div>

        <div className={styles.contactContainer}>
          <form className={styles.contactForm} onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.contactTop}>
              <div className={styles.inpBg}>
                <label htmlFor="subject" className={styles.label}>subject</label>
                <input type="text" id="subject" className={styles.inp} placeholder="What is this about?" {...register("subject")} aria-invalid={!!errors.subject} />
                {errors.subject && <small className={styles.error}>{errors.subject.message}</small>}
              </div>
              <div className={styles.inpBg}>
                <label htmlFor="name" className={styles.label}>name</label>
                <input type="text" id="name" className={styles.inp} placeholder="Your name" {...register("name")} aria-invalid={!!errors.name} />
                {errors.name && <small className={styles.error}>{errors.name.message}</small>}
              </div>
              <div className={styles.inpBg}>
                <label htmlFor="email" className={styles.label}>email</label>
                <input type="email" id="email" className={styles.inp} placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <small className={styles.error}>{errors.email.message}</small>}
              </div>
              {/* honeypot - hidden from users */}
              <input type="text" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden="true" {...register("hp")} />
            </div>

            <div className={`${styles.contactBottom} row`}>
              <div className="col-md-8">
                <div className={styles.cbLeft}>
                  <label htmlFor="message" className={styles.label}>Message</label>
                  <div className={styles.msgBg} ref={dropRef}>
                    <div className={styles.btnBg}>
                      <button className={styles.btn} type="button" onClick={() => toast("Image toolbar is for paste/drag-drop.")}> 
                        <Icon icon="mage:image-fill" className={styles.btnIcon} />
                        image
                      </button>
                      <button className={styles.btn} type="button" onClick={() => insertAtCursor("**bold** ")}> 
                        <Icon icon="formkit:color" className={styles.btnIcon} />
                        color
                      </button>
                      <button className={styles.btn} type="button" onClick={() => insertAtCursor("```\ncode\n```\n")}> 
                        <Icon icon="solar:code-bold" className={styles.btnIcon} />
                        code
                      </button>
                      <button className={styles.btn} type="button" onClick={() => insertAtCursor("\n")}> 
                        <Icon icon="si:align-left-fill" className={styles.btnIcon} />
                        align
                      </button>
                      <button className={styles.btn} type="button" onClick={() => insertAtCursor("[link text](https://)")}> 
                        <Icon icon="ci:link" className={styles.btnIcon} />
                        link
                      </button>
                    </div>
                    <textarea id="message" className={styles.msg} placeholder="Type your message here..." {...register("message")} aria-invalid={!!errors.message} />
                    {errors.message && <small className={styles.error}>{errors.message.message}</small>}
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className={styles.cbRight}>
                  <label htmlFor="addFile" className={styles.label}>Add File</label>
                  <div className={styles.addFileBg}>
                    <div className={styles.addFile}>
                      <Icon icon="line-md:folder" className={styles.addFileIcon} />
                      <p className={styles.addFileInfo}>Drop image here, paste or</p>
                      <button className={styles.select} type="button" onClick={onSelectClick}>
                        <Icon icon="basil:plus-outline" className={styles.plus} />
                        Select
                      </button>
                      <input ref={inputFileRef} id="addFile" type="file" accept="image/*,application/pdf,.txt,.doc,.docx,.zip" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
                    </div>
                    {files.length > 0 && (
                      <ul className={styles.fileList}>
                        {files.map((f, i) => (
                          <li key={`${f.name}-${i}`} className={styles.fileItem}>
                            <span className={styles.fileName}>{f.name}</span>
                            <button type="button" className={styles.removeFileBtn} onClick={() => removeFile(i)} title="Remove">
                              <Icon icon="mdi:close" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.contactBtnBg}>
              <button className={styles.send} type="submit" disabled={submitting}>
                <Icon icon="tabler:send" className={styles.sendIcon} />
                {submitting ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // ===== Inline helper to insert snippets into the textarea at cursor
  function insertAtCursor(snippet) {
    const ta = document.getElementById("message");
    if (!ta) return;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const text = ta.value;
    const next = text.slice(0, start) + snippet + text.slice(end);
    ta.value = next;
    setValue("message", next, { shouldValidate: true, shouldDirty: true });
    // move caret to end of inserted snippet
    const pos = start + snippet.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }
}
