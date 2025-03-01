// Initialize webcam
let capturedImage;
        
document.addEventListener('DOMContentLoaded', function() {
    // Start the webcam
    const video = document.getElementById('webcam');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(err) {
                console.error("An error occurred: " + err);
                alert("Camera access denied or not available");
            });
    }
    
    // Fix: Make the whole style option clickable
    document.querySelectorAll('.style-option').forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Visual feedback for selection
            document.querySelectorAll('.style-option').forEach(opt => {
                opt.style.transform = '';
                opt.style.boxShadow = '';
            });
            
            this.style.transform = 'translateY(-5px) scale(1.05)';
            this.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.18)';
        });
    });
    
    // Simulate style options being loaded with visual feedback
    document.querySelectorAll('.style-option img').forEach(img => {
        img.style.opacity = '0';
        setTimeout(() => {
            img.style.transition = 'opacity 0.5s';
            img.style.opacity = '1';
        }, 300 + Math.random() * 300);
    });
    
    // Pulse effect on the transform button
    setTimeout(() => {
        const button = document.querySelectorAll('button')[1];
        button.style.transform = 'scale(1.05) translateY(-2px)';
        button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
        button.style.transition = 'all 0.5s';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 700);
    }, 1500);
});

// Enhanced script to support the loading indicator and better UI feedback
function capture() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const preview = document.getElementById('preview');
    
    // Add a flash effect
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '0.8';
    flash.style.zIndex = '10';
    flash.style.pointerEvents = 'none';
    
    document.querySelector('.video-container').appendChild(flash);
    
    // Capture the image
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImage = canvas.toDataURL('image/jpeg');
    preview.src = capturedImage;
    console.log("Captured image data URL:", capturedImage.substring(0, 50));
    
    // Remove the flash after a brief moment
    setTimeout(() => {
        flash.style.transition = 'opacity 0.5s';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 500);
    }, 100);
    
    // Add a success message
    const message = document.createElement('div');
    message.textContent = 'Photo captured!';
    message.style.position = 'absolute';
    message.style.bottom = '10px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.padding = '0.5rem 1rem';
    message.style.backgroundColor = 'rgba(58, 134, 255, 0.9)';
    message.style.color = 'white';
    message.style.borderRadius = '20px';
    message.style.fontSize = '0.8rem';
    message.style.fontWeight = 'bold';
    message.style.zIndex = '15';
    
    document.querySelector('.preview-container').appendChild(message);
    setTimeout(() => {
        message.style.transition = 'opacity 0.5s';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
    }, 2000);
}

function submitImage() {
    if (!capturedImage) {
        alert('Please capture a photo first.');
        return;
    }
    const theme = document.querySelector('input[name="theme"]:checked')?.value;
    if (!theme) {
        alert('Please select an artistic style.');
        return;
    }

    // Show loading state
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.opacity = '0.3';

    fetch('/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage, theme: theme })
    })
    .then(response => response.json())
    .then(data => {
        // Hide loading state
        document.getElementById('loading').style.display = 'none';
        
        if (data.error) {
            alert(data.error);
        } else {
            // Reveal the result with a nice fade-in
            document.getElementById('result').src = 'data:image/jpeg;base64,' + data.image;
            document.getElementById('result').style.transition = 'opacity 0.5s';
            document.getElementById('result').style.opacity = '1';
            
            // Add a success message
            const message = document.createElement('div');
            message.textContent = 'Transformation complete!';
            message.style.position = 'absolute';
            message.style.bottom = '10px';
            message.style.left = '50%';
            message.style.transform = 'translateX(-50%)';
            message.style.padding = '0.5rem 1rem';
            message.style.backgroundColor = 'rgba(255, 0, 110, 0.9)';
            message.style.color = 'white';
            message.style.borderRadius = '20px';
            message.style.fontSize = '0.8rem';
            message.style.fontWeight = 'bold';
            message.style.zIndex = '15';
            
            document.querySelector('.result-container').appendChild(message);
            setTimeout(() => {
                message.style.transition = 'opacity 0.5s';
                message.style.opacity = '0';
                setTimeout(() => message.remove(), 500);
            }, 3000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('result').style.opacity = '1';
        alert('An error occurred during processing');
    });
}

// Function to send email with the result image
function sendEmail() {
    const emailAddress = document.getElementById('email-address').value;
    const resultImg = document.getElementById('result').src;
    const statusElement = document.getElementById('email-status');
    
    // Validate email
    if (!emailAddress || !validateEmail(emailAddress)) {
        statusElement.textContent = 'Please enter a valid email address';
        statusElement.className = 'email-status error';
        return;
    }
    
    // Show sending status
    statusElement.textContent = 'Sending...';
    statusElement.className = 'email-status';
    
    // Send to the server
    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: emailAddress,
            image: resultImg
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusElement.textContent = 'Image sent successfully!';
            statusElement.className = 'email-status success';
        } else {
            statusElement.textContent = data.error || 'Failed to send email';
            statusElement.className = 'email-status error';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        statusElement.textContent = 'Failed to send email';
        statusElement.className = 'email-status error';
    });
}

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}