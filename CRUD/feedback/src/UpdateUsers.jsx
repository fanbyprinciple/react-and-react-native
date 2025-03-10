import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import './App.css';

function UpdateUsers() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        rank: "",
        designation: "",
        date: ""
    });

    useEffect(() => {
        // Simulate fetching user data
        // Replace this with your actual data fetching logic
        setFormData({
            name: "John Doe",
            rank: "Senior",
            designation: "Software Engineer",
            date: "2024-03-11"
        });
    }, [id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Updated data:", formData);
        // Add your update logic here
        navigate('/');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    return (
        <div className="container mt-5">
            <div className="update-form-container fade-in">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="form-title">Update User</h2>
                    <Link to="/" className="btn btn-secondary">
                        Back to List
                    </Link>
                </div>

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="update-form">
                            <div className="form-group mb-3">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Rank</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="rank"
                                    value={formData.rank}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Designation</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100">
                                Update User
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdateUsers;