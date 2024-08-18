document.addEventListener("DOMContentLoaded", () => {
    const tutorialSteps = [
        "Bienvenido al escaneo de INE. Te guiaré paso a paso.",
        "Por favor gira tu celular.",
        "Ahora pon tu INE debajo de la cámara."
    ];

    let currentStep = 0;
    let hasFlashed = false;
    const tutorialText = document.getElementById("tutorial-text");
    const tutorialContainer = document.getElementById("tutorial-container");
    const rotateIcon = document.getElementById("rotate-icon");
    const nextButton = document.getElementById("next-button");
    const cameraSelectContainer = document.getElementById("cameraSelectContainer");
    const handIcon = document.getElementById("hand-icon");
    const cameraText = document.getElementById("camera-text");

    const cameraConfirmPopup = document.getElementById('camera-confirm-popup');
    const confirmYesButton = document.getElementById('confirm-yes');
    const confirmNoButton = document.getElementById('confirm-no');
    
    const scanMessageContainer = document.getElementById('scan-message-container');
    const scanMessageText = document.getElementById('scan-message-text');
    const continueButton = document.getElementById('continue-button');
    const scanImage = document.getElementById('scan-image');

    let hideElementsTimeout;
    let popupTimeout;  // popup

    function showTutorialStep(step) {
        tutorialText.textContent = tutorialSteps[step];

        if (step === 1) {
            rotateIcon.style.display = "block";
            nextButton.style.display = "none";
        } else if (step === 2) {
            rotateIcon.style.display = "none";
            scanImage.style.display = "block"; // Mostrar la imagen scan2.png 
            tutorialText.textContent = "Ahora pon tu INE debajo de la cámara.";
            nextButton.style.display = "none"; 
        } else {
            nextButton.style.display = "block";
        }
    }

    function handleOrientationChange() {
        const orientation = window.screen.orientation.type;

        if (orientation.includes('portrait')) {
            rotateMessage.style.display = 'flex';
            videoContainer.style.display = 'none';
            controls.style.display = 'none';
            handIcon.style.display = 'none';
            cameraText.style.display = 'none';
        } else {
            rotateMessage.style.display = 'none';
            videoContainer.style.display = 'block';
            controls.style.display = 'flex';
            tutorialContainer.style.display = "none";

            if (!hasFlashed) {
                flashCameraContainer();
                handIcon.style.display = 'block';
                handIcon.style.zIndex = '1001';
                cameraText.style.display = 'block';
                hasFlashed = true;

                hideElementsTimeout = setTimeout(() => {
                    handIcon.style.display = 'none';
                    cameraText.style.display = 'none';
                }, 5000);
            }
        }
    }

    function flashCameraContainer() {
        cameraSelectContainer.classList.add("flash-red");
        cameraSelectContainer.style.zIndex = '1002';
    }

    
    cameraSelectContainer.addEventListener("click", () => {
        const cameraConfirmed = sessionStorage.getItem('cameraConfirmed');
        if (!cameraConfirmed) {
            clearTimeout(popupTimeout);  
            popupTimeout = setTimeout(() => {
                cameraConfirmPopup.style.display = 'flex';
            }, 1000);  
        }

        cameraSelectContainer.classList.remove("flash-red");
        cameraSelectContainer.style.zIndex = '';
        handIcon.style.display = 'none';
        cameraText.style.display = 'none';

        clearTimeout(hideElementsTimeout);
    });

    confirmYesButton.addEventListener('click', () => {
        cameraConfirmPopup.style.display = 'none';
        sessionStorage.setItem('cameraConfirmed', 'true'); 
        // 2 segundos
        setTimeout(() => {
            scanMessageText.textContent = "Ahora pon tu INE debajo de la cámara sobre una superficie plana evita reflejos."; // Añadir el texto
            scanMessageContainer.style.display = 'flex'; 
            scanImage.style.display = 'block'; 
        }, 1000);
    });

    continueButton.addEventListener('click', () => {
        console.log("Botón continuar presionado");
        scanMessageContainer.style.display = 'none';
    });

    confirmNoButton.addEventListener('click', () => {
        cameraConfirmPopup.style.display = 'none';
    });

    nextButton.addEventListener("click", () => {
        currentStep++;
        showTutorialStep(currentStep);
    });

    window.addEventListener('orientationchange', handleOrientationChange);
    handleOrientationChange();
});
