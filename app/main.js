const UPLOAD_ENDPOINT = "https://YOUR-WORKER-URL.workers.dev/upload";

const els = {
  displayName: document.getElementById("displayName"),
  roomName: document.getElementById("roomName"),
  joinBtn: document.getElementById("joinBtn"),
  startRecordBtn: document.getElementById("startRecordBtn"),
  stopRecordBtn: document.getElementById("stopRecordBtn"),
  uploadBtn: document.getElementById("uploadBtn"),
  uploadKey: document.getElementById("uploadKey"),
  preview: document.getElementById("preview"),
  status: document.getElementById("status"),
  jitsiContainer: document.getElementById("jitsiContainer"),
};

let jitsiApi = null;
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let recordedBlob = null;

function setStatus(message) {
  els.status.textContent = message;
}

els.joinBtn.addEventListener("click", () => {
  const roomName = els.roomName.value.trim();
  const displayName = els.displayName.value.trim() || "Guest";

  if (!roomName) {
    setStatus("Please enter a room name.");
    return;
  }

  if (jitsiApi) {
    jitsiApi.dispose();
  }

  jitsiApi = new window.JitsiMeetExternalAPI("meet.jit.si", {
    roomName,
    parentNode: els.jitsiContainer,
    userInfo: { displayName },
    configOverwrite: {
      prejoinPageEnabled: true,
    },
    interfaceConfigOverwrite: {
      MOBILE_APP_PROMO: false,
    },
  });

  setStatus(`Joined room: ${roomName}`);
});

els.startRecordBtn.addEventListener("click", async () => {
  try {
    setStatus("Requesting screen/audio permissions...");
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(recordedBlob);
      els.preview.src = url;
      els.uploadBtn.disabled = false;
      setStatus(`Recording ready: ${(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    };

    mediaRecorder.start(5000);
    els.startRecordBtn.disabled = true;
    els.stopRecordBtn.disabled = false;
    setStatus("Recording started.");
  } catch (error) {
    setStatus(`Could not start recording: ${error.message}`);
  }
});

els.stopRecordBtn.addEventListener("click", () => {
  if (!mediaRecorder) {
    return;
  }

  mediaRecorder.stop();
  mediaStream?.getTracks().forEach((track) => track.stop());
  els.startRecordBtn.disabled = false;
  els.stopRecordBtn.disabled = true;
  setStatus("Stopping recording...");
});

els.uploadBtn.addEventListener("click", async () => {
  if (!recordedBlob) {
    setStatus("No recording available.");
    return;
  }

  const uploadKey = els.uploadKey.value.trim();
  if (!uploadKey) {
    setStatus("Upload key is required.");
    return;
  }

  try {
    setStatus("Uploading to private Telegram group...");

    const formData = new FormData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `recording-${timestamp}.webm`;
    formData.append("file", recordedBlob, fileName);
    formData.append("caption", `Live stream archive: ${fileName}`);

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      headers: {
        "X-Upload-Key": uploadKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${text}`);
    }

    setStatus("Upload complete. Video is in your private Telegram group.");
  } catch (error) {
    setStatus(`Upload failed: ${error.message}`);
  }
});
