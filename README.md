# Syntra
---
**Syntra** is an assistive AI system that translates EEG brainwave signals into simple emotions and needs for non-verbal children and specially abled individuals. Using machine learning, it displays clear emojis and short text on a real-time dashboard to help caregivers understand and respond quickly.

**A Brainwave-to-Emotion Translator for Non-Verbal Communication**  

*A compassionate AI system bridging the gap between unspoken needs and caregivers.*  
Built for United Hacks V6 - Human Interaction & Assistive Technology Track

**Stack:** Python, NumPy, scikit-learn, Flask, HTML, CSS, JavaScript  
**Hosting:** GitHub Pages (Frontend) | Lightweight Flask Backend  

---

## 💡 About The Project  
Syntra is more than just a web app; it’s a heartfelt tool designed to empower individuals who struggle to communicate verbally. By analyzing EEG brain signals, Syntra interprets emotional states and basic needs—such as hunger or tiredness—and presents them in an easy-to-understand format for caregivers and loved ones.  

Inspiration struck from personal moments of helplessness and observing the silent struggles of those with communication challenges. Our goal is to create a practical, accessible, and empathetic system that helps foster understanding, connection, and support.  

---

## ✨ Key Features  
🧠 **EEG-Based Emotion & Need Prediction**  
- **ML-Powered Classification:** Utilizes a trained Support Vector Machine (SVM) to decode brainwave features into clear emotional states and needs.  
- **Lightweight & Fast:** Designed for quick predictions, suitable for real-time or near-real-time use.  

🔍 **Accessible & Caregiver-Friendly Dashboard**  
- **Intuitive Interface:** Simple, clean, and designed with empathy—using soft colors, icons, and minimal clutter.  
- **Visual Feedback:** Displays predictions with emojis and icons for instant recognition.  

🔄 **Data & Contextual Insights**  
- **History & Trends:** Log and review emotional states over time to identify patterns.  
- **Personalized Support:** Facilitates better understanding and tailored care based on individual signals.  

---

## 🚀 Getting Started  
Follow these steps to set up your local environment and start using Syntra:  

### Prerequisites  
- Python 3.8+  
- pip or conda  
- EEG data features in CSV format (for testing)  
- (Optional) Trained ML model file (`model.pkl`)  

### Installation  
1. Clone the repository  
```bash
git clone https://github.com/yourusername/syntra.git  
cd syntra  
```  
2. Set up your environment and install dependencies  
```bash
pip install -r requirements.txt  
```  
3. Prepare your model and data  
- Ensure your trained model (`model.pkl`) is in the backend directory.  
- Prepare EEG feature CSV files for testing.  

4. Run the backend server  
```bash
python app.py  
```  
5. Open the frontend in your browser:  
Visit `http://localhost:5000` (or the specified port).  

---

## 🖥️ Frontend  
- Developed in **HTML, CSS, JavaScript**  
- Hosted on **GitHub Pages** for easy access and sharing.  

---

## 🛠️ Built With  
- **Python** (machine learning, data processing)  
- **scikit-learn** (ML pipeline)  
- **Flask** (API backend)  
- **HTML/CSS/JavaScript** (frontend interface)  
- **GitHub Pages** (frontend hosting)  

---

## 🤝 Contributing  
Contributions are warmly welcomed! Whether fixing bugs, improving documentation, or suggesting features, your input makes Syntra better.  

### How to Contribute  
- Fork the repository  
- Create your feature branch (`git checkout -b feature/YourFeature`)  
- Commit your changes (`git commit -m 'Add YourFeature'`)  
- Push to the branch (`git push origin feature/YourFeature`)  
- Open a pull request  

---

## 📄 License  
This project is licensed under the MIT License.

---

## ❤️ Made with love for **United Hacks V6**  

---
