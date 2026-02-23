from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
 
app = FastAPI(title="Heart Disease Prediction API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Load the model
with open('heart_disease_prediction_model.pkl', 'rb') as file:
    model = pickle.load(file)

class PatientData(BaseModel):
    Age: int
    Sex: int
    ChestPainType: int
    RestingBP: int
    Cholesterol: int
    FastingBS: int
    RestingECG: int
    MaxHR: int
    ExerciseAngina: int 
    Oldpeak: float
    ST_Slope: int

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict")
async def predict(patient_data: PatientData):
    try:
        # Convert input data to DataFrame
        input_data = pd.DataFrame([patient_data.dict()])
        
        # Make prediction
        prediction = model.predict(input_data)
        probability = model.predict_proba(input_data)[0][1]
        
        # Generate insights based on input data
        insights = []
        
        # Age insights
        if patient_data.Age > 60:
            insights.append("Age is a significant risk factor. Regular check-ups are crucial.")
        
        # Blood Pressure insights
        if patient_data.RestingBP >= 140:
            insights.append("High blood pressure detected. Consider lifestyle modifications and consult a healthcare provider.")
        elif patient_data.RestingBP <= 90:
            insights.append("Blood pressure is on the lower side. Monitor for symptoms like dizziness.")
            
        # Cholesterol insights
        if patient_data.Cholesterol > 200:
            insights.append("Cholesterol levels are elevated. Consider dietary changes and regular exercise.")
            
        # Heart Rate insights
        if patient_data.MaxHR > 170:
            insights.append("Maximum heart rate is high. Discuss exercise tolerance with your healthcare provider.")
        
        # Exercise Angina insight
        if patient_data.ExerciseAngina == 1:
            insights.append("Presence of exercise-induced angina requires careful attention and medical supervision.")
            
        # ST Slope insights
        if patient_data.ST_Slope == 2:  # Downsloping
            insights.append("ST segment slope indicates potential cardiac stress during exercise.")
            
        # Fasting Blood Sugar insights
        if patient_data.FastingBS == 1:
            insights.append("Elevated fasting blood sugar. Consider diabetes screening and management.")

        return {
            "prediction": int(prediction[0]),
            "probability": float(probability),
            "risk_level": "High Risk" if prediction[0] == 1 else "Low Risk",
            "insights": insights,
            "metrics_analysis": {
                "blood_pressure_category": "High" if patient_data.RestingBP >= 140 else "Low" if patient_data.RestingBP <= 90 else "Normal",
                "cholesterol_category": "High" if patient_data.Cholesterol > 200 else "Normal",
                "age_risk": "High" if patient_data.Age > 60 else "Moderate" if patient_data.Age > 40 else "Low"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/statistics")
async def get_statistics():
    try:
        # Load the training data
        df = pd.read_csv('Clean_data.csv')
        
        # Calculate basic statistics
        stats = {
            "age_distribution": df['Age'].value_counts().to_dict(),
            "gender_distribution": df['Sex'].value_counts().to_dict(),
            "heart_disease_distribution": df['HeartDisease'].value_counts().to_dict(),
            "avg_age": float(df['Age'].mean()),
            "avg_cholesterol": float(df['Cholesterol'].mean()),
            "correlation_matrix": df.corr()['HeartDisease'].to_dict()
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
