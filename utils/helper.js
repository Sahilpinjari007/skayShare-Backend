export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const createRandomOTP = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const getExpiryDate = (label) => {
  const now = new Date();

  switch (label) {
    case "Keep forever":
      return null; // means no expiry
    case "1 Year":
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case "60 days":
      return new Date(now.setDate(now.getDate() + 60));
    case "30 days":
      return new Date(now.setDate(now.getDate() + 30));
    case "7 days":
      return new Date(now.setDate(now.getDate() + 7));
    case "3 days":
      return new Date(now.setDate(now.getDate() + 3));
    case "1 day":
      return new Date(now.setDate(now.getDate() + 1));
    default:
      return null;
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return size.toFixed(2) + " " + sizes[i];
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const getTransferSize = (files) => {
  const totalSize = files?.reduce((acc, file) => acc + file.size, 0);
  return formatFileSize(totalSize);
};
