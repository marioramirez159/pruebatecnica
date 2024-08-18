const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const cameraSelect = document.getElementById('cameraSelect');
const rotateMessage = document.getElementById('rotate-message');
const videoContainer = document.getElementById('video-container');
const controls = document.getElementById('controls');
const topBar = document.getElementById('top-bar');
let uploadInProgress = false;
let reverseUrl = null;
let validationId = null;
let isSecondCapture = false; 

if (window.screen.orientation && window.screen.orientation.lock) {
    window.screen.orientation.lock('landscape').catch(err => console.log(err));
}

window.addEventListener('orientationchange', handleOrientationChange);
document.addEventListener('DOMContentLoaded', handleOrientationChange);

function handleOrientationChange() {
    const orientation = window.screen.orientation.type;

    if (orientation.includes('portrait')) {
        rotateMessage.style.display = 'flex';
        videoContainer.style.display = 'none';
        controls.style.display = 'none';
    } else {
        rotateMessage.style.display = 'none';
        videoContainer.style.display = 'block';
        controls.style.display = 'flex';
        topBar.style.display = 'flex';
    }
}

async function getCameras() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        if (cameraSelect.options.length > 0) {
            cameraSelect.selectedIndex = cameraSelect.options.length - 1;
            startVideo({ video: { deviceId: { exact: cameraSelect.value } } });
        }

        stream.getTracks().forEach(track => track.stop());
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

cameraSelect.onchange = () => {
    startVideo({ video: { deviceId: { exact: cameraSelect.value } } });
};

function startVideo(constraints) {
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                enableCaptureButton();
            };
        })
        .catch(err => console.error('Error accessing media devices.', err));
}

function enableCaptureButton() {
    const captureButton = document.getElementById('capture');
    if (captureButton) {
        captureButton.disabled = false;
        captureButton.addEventListener('click', captureImage);
    }
}

function captureImage() {
    if (uploadInProgress) {
        console.log('Upload in progress, capture aborted');
        return;
    }
    uploadInProgress = true;

    const captureButton = document.getElementById('capture');
    captureButton.disabled = true;
    captureButton.innerHTML = '<div class="spinner"></div><span>Espere por favor...</span>';

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    let dataUrl = canvas.toDataURL('image/jpeg');

    if (video.videoWidth < video.videoHeight) {
        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = canvas.height;
        rotatedCanvas.height = canvas.width;
        const rotatedContext = rotatedCanvas.getContext('2d');
        rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
        rotatedContext.rotate(Math.PI / 2);
        rotatedContext.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        dataUrl = rotatedCanvas.toDataURL('image/jpeg');
    }

    fetch('/upload/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'image=' + encodeURIComponent(dataUrl)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            reverseUrl = data.reverse_url;
            validationId = data.validation_id;
            console.log('Image uploaded successfully');

            setTimeout(() => {
                showOverlayMessage('Por favor, tome la foto del reverso de su INE', 5000, enableCaptureButtonForReverse);
            }, 5000);
        } else {
            console.error('Error uploading image:', data.message);
            resetCaptureButton();
        }
        uploadInProgress = false;
    })
    .catch(error => {
        console.error('Error uploading image:', error);
        resetCaptureButton();
        uploadInProgress = false;
    });
}

function resetCaptureButton() {
    const captureButton = document.getElementById('capture');
    captureButton.disabled = false;
    captureButton.innerHTML = 'Capture';
}

function enableCaptureButtonForReverse() {
    const captureButton = document.getElementById('capture');
    captureButton.innerHTML = 'Capture Reverse';
    captureButton.disabled = false;
    captureButton.removeEventListener('click', captureImage);
    captureButton.addEventListener('click', captureReverseImage);
}

function captureReverseImage() {
    if (uploadInProgress) {
        console.log('Upload in progress, capture aborted');
        return;
    }
    uploadInProgress = true;
    isSecondCapture = true; 

    const captureButton = document.getElementById('capture');
    captureButton.disabled = true;
    captureButton.innerHTML = '<div class="spinner"></div><span>Espere por favor...</span>';

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');

    setTimeout(() => {
        fetch('/upload/reverse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'image=' + encodeURIComponent(dataUrl) + '&reverse_url=' + encodeURIComponent(reverseUrl)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Reverse image uploaded successfully');

                showOverlayMessage('Estamos validando tus datos', 5000, () => {
                    validateData(validationId);
                });
            } else {
                console.error('Error uploading reverse image:', data.message);
            }
            uploadInProgress = false;
        })
        .catch(error => {
            console.error('Error uploading reverse image:', error);
            uploadInProgress = false;
        });
    }, 5000);
}

function showOverlayMessage(message, duration, callback) {
    const overlay = document.createElement('div');
    overlay.id = 'validation-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'black'; 
    overlay.style.color = 'white'; 
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.innerText = message;

    document.body.appendChild(overlay);

    if (isSecondCapture) {
        
        if (callback) callback();
    } else {
        
        setTimeout(() => {
            overlay.remove();
            resetCaptureButton(); 
            if (callback) callback();
        }, duration);
    }
}

function validateData(validationId) {
    function checkValidationStatus() {
        fetch(`/upload/validate/${validationId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Validation Response:', data);
            if (data.validation_status === 'pending') {
                console.log('Validation still pending, retrying in 5 seconds...');
                setTimeout(checkValidationStatus, 5000);
            } else {
                openModal(data.details.document_details);
            }
        })
        .catch(error => {
            console.error('Error during validation:', error);
            showOverlayMessage('Error durante la validación', 3000);
        });
    }

    checkValidationStatus();
}

function openModal(details) {
    const modal = document.getElementById('validationResultModal');
    const container = document.getElementById('document-details');
    container.innerHTML = '';

    for (const [key, value] of Object.entries(details)) {
        const detailItem = document.createElement('div');
        detailItem.className = 'detail-item';
        detailItem.textContent = `${key}: ${value}`;
        container.appendChild(detailItem);
    }

    modal.style.display = 'block';
    modal.style.zIndex = '1100'; 
}

function closeModal() {
    const modal = document.getElementById('validationResultModal');
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', getCameras);
