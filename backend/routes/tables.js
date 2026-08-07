const express = require('express');
const router = express.Router();
const { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } = require('../firebase');

const TABLES_COLLECTION = 'excel_tables';

// Helper: Convert 2D array to array of objects (for Firestore storage)
function arrayToObjects(headers, data) {
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      const key = `col_${i}`;
      obj[key] = row[i] !== undefined && row[i] !== null ? row[i] : '';
    });
    return obj;
  });
}

// Helper: Convert array of objects back to 2D array
function objectsToArray(headers, objects) {
  return objects.map(obj => {
    return headers.map((_, i) => {
      const key = `col_${i}`;
      return obj[key] !== undefined ? obj[key] : '';
    });
  });
}

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tablesCol = collection(db, TABLES_COLLECTION);
    const snapshot = await getDocs(tablesCol);
    const tables = snapshot.docs.map(d => {
      const tableData = d.data();
      // Convert objects back to array format for frontend
      if (tableData.dataObjects && tableData.headers) {
        tableData.data = objectsToArray(tableData.headers, tableData.dataObjects);
        delete tableData.dataObjects;
      }
      // Include notifySettings if exists
      if (!tableData.notifySettings) {
        tableData.notifySettings = null;
      }
      return { id: d.id, ...tableData };
    });
    res.json(tables);
  } catch (error) {
    console.error('[Tables] Error fetching tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single table
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableRef = doc(db, TABLES_COLLECTION, id);
    const tableSnap = await getDoc(tableRef);
    
    if (!tableSnap.exists()) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const tableData = tableSnap.data();
    // Convert objects back to array format for frontend
    if (tableData.dataObjects && tableData.headers) {
      tableData.data = objectsToArray(tableData.headers, tableData.dataObjects);
      delete tableData.dataObjects;
    }
    // Include notifySettings if exists
    if (!tableData.notifySettings) {
      tableData.notifySettings = null;
    }
    
    res.json({ id: tableSnap.id, ...tableData });
  } catch (error) {
    console.error('[Tables] Error fetching table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new table
router.post('/', async (req, res) => {
  try {
    const { name, headers, data, notifySettings } = req.body;
    
    console.log('[Tables] Creating table:', name, '| Headers:', headers?.length, '| Rows:', data?.length);
    
    if (!name || !headers || !data) {
      return res.status(400).json({ error: 'Name, headers and data are required' });
    }

    // Convert 2D array to objects for Firestore storage
    const dataObjects = arrayToObjects(headers, data);

    const tablesCol = collection(db, TABLES_COLLECTION);
    const docRef = await addDoc(tablesCol, {
      name,
      headers,
      dataObjects,
      notifySettings: notifySettings || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('[Tables] Table created successfully with ID:', docRef.id);
    res.json({ id: docRef.id, name, headers, data, notifySettings });
  } catch (error) {
    console.error('[Tables] Error creating table:', error.message);
    console.error('[Tables] Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update table (full replace)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, headers, data, notifySettings } = req.body;
    
    // Convert 2D array to objects for Firestore storage
    const dataObjects = arrayToObjects(headers, data);
    
    const tableRef = doc(db, TABLES_COLLECTION, id);
    const updateData = {
      name,
      headers,
      dataObjects,
      updatedAt: serverTimestamp()
    };
    
    // Only update notifySettings if provided
    if (notifySettings !== undefined) {
      updateData.notifySettings = notifySettings;
    }
    
    await updateDoc(tableRef, updateData);

    res.json({ id, name, headers, data, notifySettings });
  } catch (error) {
    console.error('[Tables] Error updating table:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update single cell
router.patch('/:id/cell', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowIndex, colIndex, value } = req.body;
    
    const tableRef = doc(db, TABLES_COLLECTION, id);
    const tableSnap = await getDoc(tableRef);
    
    if (!tableSnap.exists()) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const tableData = tableSnap.data();
    const newDataObjects = [...tableData.dataObjects];
    
    if (newDataObjects[rowIndex]) {
      newDataObjects[rowIndex] = { ...newDataObjects[rowIndex] };
      newDataObjects[rowIndex][`col_${colIndex}`] = value;
    }

    await updateDoc(tableRef, {
      dataObjects: newDataObjects,
      updatedAt: serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Tables] Error updating cell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableRef = doc(db, TABLES_COLLECTION, id);
    await deleteDoc(tableRef);
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('[Tables] Error deleting table:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
