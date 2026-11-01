/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export const humanFileSize = (bytes: number, si = false, dp = 1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};

export const getAppointmentBucket = (id: string) => `appointments/${id}`;
export const getCustomerBucket = (id: string) => `customers/${id}`;

export const validateFileType = (file: File, acceptString: string) => {
  if (!acceptString) {
    return true; // No accept attribute specified, so all files are technically "accepted"
  }

  const acceptedTypes = acceptString.replace(/\s/g, "").split(",");

  // Check if any accepted type matches the file's type or extension
  return acceptedTypes.some((accept) => {
    // Escape special characters for regex, then replace '*' with '.*'
    const regex = new RegExp(
      accept.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&").replace("\\*", ".*"),
    );

    // Check if the file's MIME type matches the pattern
    if (regex.test(file.type)) {
      return true;
    }

    // Also check if the file's extension matches if an extension was provided
    if (accept.startsWith(".")) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const acceptedExtension = accept.substring(1).toLowerCase();
      return fileExtension === acceptedExtension;
    }

    return false;
  });
};
