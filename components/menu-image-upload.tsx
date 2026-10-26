'use client';
import { useEffect, useState } from 'react';

export function MenuImageUpload({ currentSrc }: { currentSrc?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div>
      <label>
        Upload dish photo from your device
        <input
          name="dishPhoto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const chosen = event.currentTarget.files?.[0] ?? null;
            const error =
              chosen && chosen.size > 4 * 1024 * 1024 ? 'Choose a photo smaller than 4 MB.' : '';
            event.currentTarget.setCustomValidity(error);
            if (error) event.currentTarget.reportValidity();
            setFile(error ? null : chosen);
          }}
        />
      </label>
      <p className="muted">
        JPEG, PNG or WebP, up to 4 MB; minimum 100 × 100 pixels. A new upload replaces the selected
        image when you save. Leave blank to keep your image selection.
      </p>
      {(preview || currentSrc) && (
        <img
          className="admin-thumbnail"
          src={preview ?? currentSrc}
          alt={preview ? 'Selected dish photo preview' : 'Current dish photo'}
        />
      )}
      {file && <p role="status">{file.name} selected. Click Save changes to upload.</p>}
    </div>
  );
}
