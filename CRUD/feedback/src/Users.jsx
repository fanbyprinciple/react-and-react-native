import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactStars from 'react-stars';
import './App.css';

function Users() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reviews');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    return (
        <div className="container mt-5 fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="form-title">Reviews List</h2>
                <Link to="/create" className="btn btn-primary">
                    Add New Review
                </Link>
            </div>
            
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Rank</th>
                            <th>Designation</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.rank}</td>
                                <td>{user.designation}</td>
                                <td>
                                    <ReactStars
                                        count={5}
                                        value={user.rating}
                                        size={20}
                                        color2={'#ffd700'}
                                        edit={false}
                                        half={false}
                                    />
                                </td>
                                <td>
                                    <div className="comment-cell">
                                        {user.comment}
                                    </div>
                                </td>
                                <td>{new Date(user.date).toLocaleDateString()}</td>
                                <td>
                                    <Link 
                                        to={`/update/${user._id}`} 
                                        className="btn btn-primary btn-sm me-2"
                                    >
                                        Edit
                                    </Link>
                                    <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => {
                                            console.log("Delete user:", user._id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Users;