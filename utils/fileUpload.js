const multer = require("multer");

const memoryStorage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname);
  },
});

function fileFilter(req, file, cb) {
  const allowedMimes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format"), false);
  }
}

const uploadDisk = multer({ storage: diskStorage, fileFilter });
const uploadMemory = multer({ storage: memoryStorage, fileFilter });
const upload = uploadDisk; // default export

const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) return "0 Bytes";
  const dm = decimal || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  return parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index];
};

module.exports = { upload, uploadDisk, uploadMemory, fileSizeFormatter };
