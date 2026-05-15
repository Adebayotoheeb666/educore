import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import parentService from '../../services/parentService';
import { getStudents } from '../../services/studentService';
import { useClientPagination } from '../../hooks/useClientPagination';
import ListPagination from '../../components/pagination/ListPagination';
import Modal from '../../components/layout/Modal';
import AvatarUpload from '../../components/layout/AvatarUpload';
import PasswordInput from '../../components/layout/PasswordInput';
import './Students.css';

const Parents = () => {
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', avatar: '' });
    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [parentsData, studentsData] = await Promise.all([
                parentService.getParents(),
                getStudents()
            ]);
            setParents(parentsData);
            setStudents(studentsData.data?.students ?? studentsData.data ?? []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredParents = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return parents.filter(p => {
            return !q || 
                   (p.name ?? '').toLowerCase().includes(q) || 
                   (p.email ?? '').toLowerCase().includes(q) || 
                   (p.phone ?? '').includes(q);
        });
    }, [parents, searchQuery]);

    const {
        paginatedItems: paginatedParents,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems: filteredCount,
        rangeStart,
        rangeEnd,
    } = useClientPagination(filteredParents, 10, [searchQuery]);

    // --- Handlers ---
    
    const handleOpenAdd = () => {
        setFormData({ name: '', email: '', phone: '', password: 'password123', avatar: '' });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (parent) => {
        setSelectedParent(parent);
        setFormData({ name: parent.name, email: parent.email, phone: parent.phone, password: '', avatar: parent.avatar || '' });
        setIsEditModalOpen(true);
    };

    const handleOpenAssign = (parent) => {
        setSelectedParent(parent);
        setSelectedStudentId('');
        setIsAssignModalOpen(true);
    };

    const handleAddParent = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const newParent = await parentService.createParent(formData);
            setParents(prev => [...prev, newParent]);
            toast.success('Parent account created successfully');
            setIsAddModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create parent');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateParent = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const updateData = { ...formData };
            if (!updateData.password) delete updateData.password;
            
            const updated = await parentService.updateParent(selectedParent._id, updateData);
            setParents(prev => prev.map(p => p._id === updated._id ? updated : p));
            toast.success('Parent details updated');
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update parent');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignChild = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return toast.error("Please select a student");
        
        setSubmitting(true);
        try {
            await parentService.assignChild({
                parentId: selectedParent._id,
                studentId: selectedStudentId
            });
            toast.success('Child assigned successfully');
            setIsAssignModalOpen(false);
            fetchData(); // Refresh to show new links
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign child');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await parentService.deleteParent(id);
            setParents(prev => prev.filter(p => (p._id ?? p.id) !== id));
            toast.success('Parent deleted');
        } catch (err) {
            toast.error(err?.response?.data?.message ?? 'Failed to delete parent');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleUnlink = async (parentId, studentId) => {
        if (!window.confirm('Are you sure you want to unlink this student from this parent?')) return;
        try {
            await parentService.unlinkChild({ parentId, studentId });
            setParents(prev => prev.map(p => {
                if ((p._id ?? p.id) === parentId) {
                    return { ...p, children: p.children.filter(c => c._id !== studentId) };
                }
                return p;
            }));
            toast.success('Student unlinked successfully');
        } catch (error) {
            toast.error('Failed to unlink student');
        }
    };

    return (
        <div className="students-container">
            <div className="page-header-row">
                <div className="page-header-text">
                    <h1>{parents.length ? `${parents.length.toLocaleString()} Total Parents` : 'Parents'}</h1>
                    <p>Managing parent accounts and student relationships.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary-green" onClick={handleOpenAdd}>
                        <span>👤+</span> Add Parent
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input-wrap">
                    <span className="search-icon" style={{position: 'absolute', left: '1.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    className="filter-icon-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear filters"
                >
                    <span>📊</span>
                </button>
            </div>

            <div className="premium-table-card">
                {loading ? (
                    <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>Loading parents…</div>
                ) : filteredParents.length === 0 ? (
                    <div style={{padding: '4rem', textAlign: 'center', color: '#64748b'}}>
                        {parents.length === 0 ? 'No parents found.' : 'No parents match your filters.'}
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Children</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedParents.map(parent => (
                                <tr key={parent._id ?? parent.id}>
                                    <td>
                                        <div className="student-info-cell">
                                            <div className="student-avatar-small">
                                                <img src={parent.avatar || `https://ui-avatars.com/api/?name=${parent.name}&background=random`} alt="" style={{width: '100%'}} />
                                            </div>
                                            <div className="student-name-stack">
                                                <h4>{parent.name}</h4>
                                                <p>Member since {new Date(parent.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{parent.email}</td>
                                    <td><span className="phone-text">{parent.phone}</span></td>
                                    <td>
                                        <div style={{display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center'}}>
                                            {parent.children?.length > 0 ? parent.children.map(child => (
                                                <div key={child._id} className="student-pill-premium">
                                                    <img src={child.avatar || `https://ui-avatars.com/api/?name=${child.name}&background=random`} alt="" className="pill-avatar" />
                                                    <span className="pill-name">{child.name}</span>
                                                    <button className="btn-unlink" onClick={() => handleUnlink(parent._id ?? parent.id, child._id)} title={`Unlink ${child.name}`}>×</button>
                                                </div>
                                            )) : <span style={{color: '#94a3b8', fontSize: '1.2rem', padding: '0.4rem 0'}}>No children linked</span>}
                                            <button 
                                                className="btn-add-mini hover-scale" 
                                                onClick={() => handleOpenAssign(parent)}
                                                title="Assign Child"
                                                style={{border: '1px dashed #6A5ACD', background: '#f8fafc', color: '#6A5ACD', borderRadius: '20px', cursor: 'pointer', padding: '0.4rem 1rem', fontSize: '1.2rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center'}}
                                            >
                                                + Link Student
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <button className="btn-icon-premium edit" onClick={() => handleOpenEdit(parent)} title="Edit Parent">✏️</button>
                                            {confirmDeleteId === (parent._id ?? parent.id) ? (
                                                <>
                                                    <button
                                                        onClick={() => handleDelete(parent._id ?? parent.id)}
                                                        disabled={!!deletingId}
                                                        className="btn-confirm-delete"
                                                        style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        {deletingId === (parent._id ?? parent.id) ? '…' : 'Confirm'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(parent._id ?? parent.id)}
                                                    style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#fff0f0', color: '#ef4444', border: '1px solid #fecaca', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && filteredCount > 0 && (
                    <ListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredCount}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onPageChange={setCurrentPage}
                        itemLabel={`parents${searchQuery ? ' (filtered)' : ''}`}
                        className="table-footer"
                    />
                )}
            </div>

            {/* --- Modals --- */}

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Parent">
                <form onSubmit={handleAddParent} className="modal-form-premium">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <AvatarUpload
                            currentAvatar={formData.avatar}
                            name={formData.name}
                            onAvatarChange={(base64) => setFormData(prev => ({ ...prev, avatar: base64 || '' }))}
                        />
                    </div>
                    <div className="form-group-premium mb-3">
                        <label>Full Name</label>
                        <input type="text" required placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="form-group-premium mb-3">
                        <label>Email Address</label>
                        <input type="email" required placeholder="parent@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="form-group-premium mb-3">
                        <label>Phone Number</label>
                        <input type="tel" required placeholder="+234 800 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="form-group-premium mb-4">
                        <label>Password</label>
                        <PasswordInput 
                            name="password"
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            required 
                            minLength={8}
                        />
                    </div>
                    <button type="submit" className="btn-submit w-100" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Parent Account'}
                    </button>
                </form>
            </Modal>

            {/* Edit Parent Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Parent Details">
                <form onSubmit={handleUpdateParent} className="modal-form-premium">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <AvatarUpload
                            currentAvatar={formData.avatar}
                            name={formData.name}
                            onAvatarChange={(base64) => setFormData(prev => ({ ...prev, avatar: base64 || '' }))}
                        />
                    </div>
                    <div className="form-group-premium mb-3">
                        <label>Full Name</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="form-group-premium mb-3">
                        <label>Email Address</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="form-group-premium mb-3">
                        <label>Phone Number</label>
                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="form-group-premium mb-4">
                        <label>New Password (leave blank to keep current)</label>
                        <PasswordInput 
                            name="password"
                            placeholder="••••••••" 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            required={false}
                            minLength={8}
                        />
                    </div>
                    <button type="submit" className="btn-submit w-100" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Update Parent'}
                    </button>
                </form>
            </Modal>

            {/* Assign Child Modal */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Link Student to ${selectedParent?.name}`}>
                <form onSubmit={handleAssignChild} className="modal-form-premium">
                    <div className="form-group-premium mb-4">
                        <label>Select Student</label>
                        <select 
                            required 
                            value={selectedStudentId} 
                            onChange={e => setSelectedStudentId(e.target.value)}
                            style={{width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                        >
                            <option value="">-- Choose a student --</option>
                            {students.filter(s => s.parentId !== selectedParent?._id).map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.name} ({s.admissionNo})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{background: '#eff6ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '1.3rem', color: '#1e40af'}}>
                        This student will be able to see their results and fees linked to this parent account.
                    </div>
                    <button type="submit" className="btn-submit w-100" disabled={submitting}>
                        {submitting ? 'Linking...' : 'Assign Student'}
                    </button>
                </form>
            </Modal>

            <style>{`
                .modal-form-premium .form-group-premium input,
                .modal-form-premium .form-group-premium select {
                    width: 100%;
                    padding: 1.2rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 1.4rem;
                }
                .btn-submit {
                    background: var(--brand-color);
                    color: white;
                    border: none;
                    padding: 1.4rem;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default Parents;
