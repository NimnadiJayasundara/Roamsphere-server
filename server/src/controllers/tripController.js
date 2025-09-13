import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Create a new trip request
export const createTripRequest = async (req, res) => {
    try {
        const {
            title,
            category,
            origin,
            destination,
            stops,
            preferredDate,
            preferredTime,
            returnDate,
            returnTime,
            passengerCount,
            passengerNames,
            contactName,
            contactPhone,
            contactEmail,
            vehicleType,
            specialRequirements,
            budget,
            notes
        } = req.body;

        // Get customer ID from JWT token
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Validate required fields
        if (!title || !category || !origin || !destination || !preferredDate || !preferredTime || !contactName || !contactPhone || !contactEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const tripId = uuidv4();

        const query = `
            INSERT INTO Trip (
                trip_id, customer_id, title, category, origin, destination, stops,
                preferred_date, preferred_time, return_date, return_time,
                passenger_count, passenger_names, contact_name, contact_phone, contact_email,
                vehicle_type, special_requirements, budget, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            tripId, customerId, title, category, origin, destination, stops || null,
            preferredDate, preferredTime, returnDate || null, returnTime || null,
            passengerCount || 1, passengerNames || null, contactName, contactPhone, contactEmail,
            vehicleType || null, specialRequirements || null, budget || null, notes || null
        ];

        await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Trip request created successfully',
            data: {
                tripId,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Error creating trip request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create trip request',
            error: error.message
        });
    }
};

// Get specific trip by ID
export const getTripRequestById = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const [trips] = await pool.query(`
            SELECT t.*, 
                   d.user_id as driver_user_id, du.first_name as driver_first_name, 
                   du.last_name as driver_last_name, d.mobile as driver_mobile,
                   v.model as vehicle_model, v.license_plate as vehicle_plate, 
                   v.seating_capacity, v.color as vehicle_color
            FROM Trip t
            LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
            LEFT JOIN SystemUser du ON d.user_id = du.user_id
            LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
            WHERE t.trip_id = ? AND t.customer_id = ?
        `, [tripId, customerId]);

        if (trips.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            data: trips[0]
        });

    } catch (error) {
        console.error('Error fetching trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip',
            error: error.message
        });
    }
};

// Update trip request
export const updateTripRequest = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if trip exists and belongs to customer
        const [existingTrip] = await pool.query(
            'SELECT status FROM Trip WHERE trip_id = ? AND customer_id = ?',
            [tripId, customerId]
        );

        if (existingTrip.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Only allow updates if trip is pending
        if (existingTrip[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update trip that is not pending'
            });
        }

        const updateFields = [];
        const updateValues = [];

        // Build dynamic update query
        const allowedFields = [
            'title', 'category', 'origin', 'destination', 'stops',
            'preferred_date', 'preferred_time', 'return_date', 'return_time',
            'passenger_count', 'passenger_names', 'contact_name', 'contact_phone', 'contact_email',
            'vehicle_type', 'special_requirements', 'budget', 'notes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(tripId, customerId);

        const query = `UPDATE Trip SET ${updateFields.join(', ')} WHERE trip_id = ? AND customer_id = ?`;
        
        await pool.query(query, updateValues);

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully'
        });

    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update trip',
            error: error.message
        });
    }
};

// Get all trip requests for a customer
export const getCustomerTripRequests = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        const { status, page = 1, limit = 10 } = req.query;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        let query = `
            SELECT t.*, d.user_id as driver_user_id, su.first_name as driver_first_name, 
                   su.last_name as driver_last_name, v.model as vehicle_model, 
                   v.license_plate as vehicle_plate
            FROM Trip t
            LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
            LEFT JOIN SystemUser su ON d.user_id = su.user_id
            LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
            WHERE t.customer_id = ?
        `;

        const queryParams = [customerId];

        if (status) {
            query += ' AND t.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY t.created_at DESC';

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [trips] = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM Trip WHERE customer_id = ?';
        const countParams = [customerId];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                trips,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching trip requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip requests',
            error: error.message
        });
    }
};

// Get trip statistics for customer dashboard
export const getTripStatistics = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const query = `
            SELECT 
                COUNT(*) as total_trips,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_trips,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_trips,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as active_trips,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips
            FROM Trip 
            WHERE customer_id = ?
        `;

        const [result] = await pool.query(query, [customerId]);

        res.status(200).json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Error fetching trip statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip statistics',
            error: error.message
        });
    }
};

// Cancel trip request
export const cancelTripRequest = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if trip exists and belongs to customer
        const [existingTrip] = await pool.query(
            'SELECT status FROM Trip WHERE trip_id = ? AND customer_id = ?',
            [tripId, customerId]
        );

        if (existingTrip.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip request not found'
            });
        }

        if (['completed', 'cancelled'].includes(existingTrip[0].status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel trip that is ${existingTrip[0].status}`
            });
        }

        await pool.query(
            'UPDATE Trip SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND customer_id = ?',
            ['cancelled', tripId, customerId]
        );

        res.status(200).json({
            success: true,
            message: 'Trip request cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling trip request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel trip request',
            error: error.message
        });
    }
};

// Admin functions
export const getAllTripRequests = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10, startDate, endDate } = req.query;

        let query = `
            SELECT t.*, 
                   cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email,
                   c.phone as customer_phone, c.verification_status,
                   d.user_id as driver_user_id, du.first_name as driver_first_name, du.last_name as driver_last_name,
                   v.model as vehicle_model, v.license_plate as vehicle_plate, v.seating_capacity
            FROM Trip t
            JOIN Customer c ON t.customer_id = c.customer_id
            JOIN SystemUser cu ON c.user_id = cu.user_id
            LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
            LEFT JOIN SystemUser du ON d.user_id = du.user_id
            LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
            WHERE 1=1
        `;

        const queryParams = [];

        if (status) {
            query += ' AND t.status = ?';
            queryParams.push(status);
        }

        if (category) {
            query += ' AND t.category = ?';
            queryParams.push(category);
        }

        if (startDate) {
            query += ' AND t.preferred_date >= ?';
            queryParams.push(startDate);
        }

        if (endDate) {
            query += ' AND t.preferred_date <= ?';
            queryParams.push(endDate);
        }

        query += ' ORDER BY t.created_at DESC';

        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [trips] = await pool.query(query, queryParams);

        res.status(200).json({
            success: true,
            data: { trips }
        });

    } catch (error) {
        console.error('Error fetching all trips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trips',
            error: error.message
        });
    }
};

export const assignTripToDriver = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { driverId, vehicleId, estimatedCost } = req.body;

        await pool.query(`
            UPDATE Trip 
            SET assigned_driver_id = ?, assigned_vehicle_id = ?, 
                estimated_cost = ?, status = 'confirmed'
            WHERE trip_id = ?
        `, [driverId, vehicleId, estimatedCost, tripId]);

        res.status(200).json({
            success: true,
            message: 'Trip assigned successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to assign trip',
            error: error.message
        });
    }
};

export const updateTripStatus = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { status } = req.body;

        await pool.query(
            'UPDATE Trip SET status = ? WHERE trip_id = ?',
            [status, tripId]
        );

        res.status(200).json({
            success: true,
            message: 'Trip status updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update trip status',
            error: error.message
        });
    }
};

