# AI style transfer web application

This is a web application for performing style transfer using a pre-trained machine learning model. The model is powered by TensorFlow Hub, a library of reusable machine learning models.

## Pre-requisites

- Virtual environment (recommended: `conda`)

```bash
conda create -n style_transfer python=3.11
conda activate style_transfer
```

- Install dependencies

```bash
pip install flask tensorflow tensorflow_hub pillow python-dotenv smtplib 
```

These packages are essential:

1. Flask: To create the backend server.
2. TensorFlow: For running the style transfer model.
3. TensorFlow Hub: To load the pre-trained style transfer model.
4. Pillow: For image processing.
5. dotenv: For loading environment variables from a .env file.
6. smtplib: For sending emails.

## Getting started

1. Clone the repository

```bash
git clone https://github.com/kavinsde/interactive-style-transfer-demo.git
```

2. Start the application

```bash
cd interactive-style-transfer-demo
```

```bash
python app.py
```

Open the application in your browser at http://localhost:5000
