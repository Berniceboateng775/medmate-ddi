import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const AddNewPatient = () => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [drugRecords, setDrugRecords] = useState([
    { drug_name: '', start_date: '', end_date: '' }
  ]);

  const navigate = useNavigate();

  const handleAddDrug = () => {
    setDrugRecords([...drugRecords, { drug_name: '', start_date: '', end_date: '' }]);
  };

  const handleRemoveDrug = (index) => {
    const updated = [...drugRecords];
    updated.splice(index, 1);
    setDrugRecords(updated);
  };

  const handleDrugChange = (index, field, value) => {
    const updated = [...drugRecords];
    updated[index][field] = value;
    setDrugRecords(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create the patient first
      const patientRes = await API.post('/patients/create/', {
        name,
        dob,
        gender,
      });
      const patientId = patientRes.data.id;

      // Submit each drug record
      for (const record of drugRecords) {
        if (record.drug_name) {
          await API.post('/drugs/', {
            patient: patientId,
            ...record,
          });
        }
      }

      alert('Patient and drug records added!');
      navigate('/pharmacist/patients'); // or '/doctor/patients' if doctor
    } catch (err) {
      console.error(err);
      alert('Error creating patient or drug records.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Patient</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div>
          <label className="block font-semibold mb-1">Full Name</label>
          <input
            type="text"
            className="w-full border px-4 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Date of Birth</label>
            <input
              type="date"
              className="w-full border px-4 py-2 rounded"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Gender</label>
            <select
              className="w-full border px-4 py-2 rounded"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Drug Records</h2>
          {drugRecords.map((record, index) => (
            <div key={index} className="grid md:grid-cols-3 gap-4 items-end">
              <input
                type="text"
                className="border px-3 py-2 rounded"
                placeholder="Drug Name"
                value={record.drug_name}
                onChange={(e) => handleDrugChange(index, 'drug_name', e.target.value)}
              />
              <input
                type="date"
                className="border px-3 py-2 rounded"
                value={record.start_date}
                onChange={(e) => handleDrugChange(index, 'start_date', e.target.value)}
              />
              <input
                type="date"
                className="border px-3 py-2 rounded"
                value={record.end_date}
                onChange={(e) => handleDrugChange(index, 'end_date', e.target.value)}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDrug(index)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddDrug}
            className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Add Another Drug
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700"
        >
          Submit Patient
        </button>
      </form>
    </div>
  );
};

export default AddNewPatient;
