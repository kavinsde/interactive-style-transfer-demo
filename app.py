from flask import Flask, request, jsonify, send_from_directory
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from PIL import Image
import io
import base64
import os
from dotenv import load_dotenv

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

app = Flask(__name__)
load_dotenv()

# Load the style transfer model from TensorFlow Hub
model = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')

# Preload and preprocess style images
style_images = {
    'van_gogh': tf.io.read_file(os.path.join('styles', 'van_gogh.jpg')),
    'picasso': tf.io.read_file(os.path.join('styles', 'picasso.jpg')),
    'monet': tf.io.read_file(os.path.join('styles', 'monet.jpg')),
    'pedro_paricio': tf.io.read_file(os.path.join('styles', 'pedro_paricio.jpeg')),
}
for key in style_images:
    style_images[key] = tf.image.decode_image(style_images[key], channels=3)
    style_images[key] = tf.image.resize(style_images[key], (256, 256)) / 255.0

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/about')
def about():
    return send_from_directory('static', 'about.html')

@app.route('/gallery')
def gallery():
    return send_from_directory('static', 'gallery.html')

@app.route('/how_it_works')
def how_it_works():
    return send_from_directory('static', 'how_it_works.html')

@app.route('/docs')
def docs():
    return send_from_directory('static', 'docs.html')

# Serve static files (like script.js and thumbnails)
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Process the uploaded image and apply style transfer
@app.route('/process', methods=['POST'])
def process():
    data = request.get_json()
    print("Received data:", data)  # Log full payload
    image_data = data['image'].split(',')[1]
    print("Received image data (first 50 chars):", data['image'][:50])
    
    try:
        # Decode
        try:
            decoded_bytes = base64.b64decode(image_data)
            content_img = tf.image.decode_image(decoded_bytes, channels=3)
            print("Image decoded successfully")
        except ValueError as e:
            print("Base64 decode error:", e)
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Resize and normalize
        content_img = tf.image.resize(content_img, (256, 256)) / 255.0
        print("Resized shape:", content_img.shape)
        
        # Get style image
        print("Requested theme:", data['theme'])
        if data['theme'] not in style_images:
            print("Invalid theme selected")
            return jsonify({'error': 'Invalid theme'}), 400
        style_img = style_images[data['theme']]
        print("Style image shape:", style_img.shape)
        
        # Model inference
        content_tensor = tf.constant(content_img[tf.newaxis, ...])  # Adds batch dimension: (1, 256, 256, 3)
        style_tensor = tf.constant(style_img[tf.newaxis, ...])      # Adds batch dimension: (1, 256, 256, 3)
        print("Content tensor shape:", content_tensor.shape)
        print("Style tensor shape:", style_tensor.shape)

        # Model inference (assuming 'model' is loaded from TensorFlow Hub)
        stylized_img = model(content_tensor, style_tensor)  # This returns a list
        print("Model inference completed, output type:", type(stylized_img))

        # Check if the output is a list and access the tensor
        if isinstance(stylized_img, list):
            stylized_img = stylized_img[0]  # Get the first element (the stylized image tensor)
        print("Stylized image shape:", stylized_img.shape)

        # Remove the batch dimension if present (e.g., from (1, 256, 256, 3) to (256, 256, 3))
        if len(stylized_img.shape) == 4:
            stylized_img = stylized_img[0]
        print("Batch dimension removed, shape:", stylized_img.shape)

        # Scale pixel values from [0, 1] to [0, 255] and cast to uint8
        stylized_img = tf.cast(stylized_img * 255, tf.uint8)
        print("Image scaled and cast")

        # Encode the image as JPEG
        stylized_img = tf.image.encode_jpeg(stylized_img)
        print("Image encoded as JPEG")

        return jsonify({'image': base64.b64encode(stylized_img.numpy()).decode('utf-8')})
    except Exception as e:
        print("Processing error:", type(e).__name__, str(e))
        return jsonify({'error': 'Image processing failed'}), 500



# Email sending endpoint
@app.route('/send-email', methods=['POST'])
def send_email():
    data = request.get_json()
    recipient_email = data.get('email')
    image_data = data.get('image')
    
    if not recipient_email or not image_data:
        return jsonify({'success': False, 'error': 'Missing email or image data'}), 400
    
    try:
        # Extract base64 image data
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Create email
        msg = MIMEMultipart()
        msg['Subject'] = 'Your Artistic AI Creation'
        msg['From'] = 'manokavin26062002@gmail.com'  # Replace with your email
        msg['To'] = recipient_email
        
        # Email body
        text = MIMEText('''
        <html>
        <body>
            <h2>Your ArtisticAI Masterpiece</h2>
            <p>Thank you for using ArtisticAI! Attached is your stylized image.</p>
            <div>
                <img src="cid:image1" style="max-width: 100%;">
            </div>
            <p>Best regards,<br>ArtisticAI by Kavin</p>
        </body>
        </html>
        ''', 'html')
        msg.attach(text)
        
        # Attach image
        image = MIMEImage(base64.b64decode(image_data))
        image.add_header('Content-ID', '<image1>')
        image.add_header('Content-Disposition', 'inline', filename='artistic_image.jpg')
        msg.attach(image)

        EMAIL_USERNAME = os.getenv('EMAIL_USERNAME')
        EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)  
            server.send_message(msg)
        
        return jsonify({'success': True})
    
    except Exception as e:
        print("Email sending error:", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)