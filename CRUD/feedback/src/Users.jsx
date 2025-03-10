import React, { useState } from "react";
import { Link } from "react-router-dom";
import './App.css';

function Users() {
    // Sample data - replace with your actual data source
    const [users, setUsers] = useState([
        {
            id: 1,
            name: "John Doe",
            rank: "Senior",
            designation: "Software Engineer",
            date: "2024-03-11"
        },
        {
            id: 2,
            name: "Jane Smith",
            rank: "Lead",
            designation: "Project Manager",
            date: "2024-03-10"
        }
    ]);

    return (
        <div className="container mt-5 fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="form-title">Users List</h2>
                <Link to="/create" className="btn btn-primary">
                    Add New User
                </Link>
            </div>
            
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Rank</th>
                            <th>Designation</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.rank}</td>
                                <td>{user.designation}</td>
                                <td>{user.date}</td>
                                <td>
                                    <Link 
                                        to={`/update/${user.id}`} 
                                        className="btn btn-primary btn-sm me-2"
                                    >
                                        Edit
                                    </Link>
                                    <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => {
                                            console.log("Delete user:", user.id);
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