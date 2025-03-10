import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactStars from 'react-stars';
import PropTypes from 'prop-types';
import './App.css';

function CreateUsers() {
    const [formData, setFormData] = useState({
        name: "",
        rank: "",
        designation: "",
        rating: 0,
        comment: "",
        date: new Date().toISOString().split('T')[0]
    });

    const [submitError, setSubmitError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        
        try {
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                navigate('/');
            } else {
                const error = await response.json();
                setSubmitError(error.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setSubmitError('Network error - please try again');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingChange = (newRating) => {
        setFormData(prev => ({
            ...prev,
            rating: newRating
        }));
    };

    return (
        <div className="container mt-5">
            <div className="create-form-container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="form-title">Submit Review</h2>
                    <Link to="/" className="btn btn-secondary">
                        Back to List
                    </Link>
                </div>

                <div className="card shadow-sm">
                    <div className="card-body">
                        {submitError && (
                            <div className="alert alert-danger mb-3">
                                {submitError}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="create-form">
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
                                <label className="form-label">Rating</label>
                                <div className="stars-container">
                                    <ReactStars
                                        count={5}
                                        onChange={handleRatingChange}
                                        size={24}
                                        color2={'#ffd700'}
                                        value={formData.rating}
                                        half={false}
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Comment</label>
                                <textarea
                                    className="form-control"
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                    placeholder="Write your review here..."
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary w-100"
                                disabled={formData.rating === 0}
                            >
                                Submit Review
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

CreateUsers.propTypes = {
    onSubmit: PropTypes.func
};

export default CreateUsers;