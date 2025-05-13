'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/use-supabase';
import { Button } from '@/components/ui/button';

interface DataItem {
  id: string | number;
  [key: string]: any;
}

interface DataFetchExampleProps {
  tableName: string;
  initialFilters?: Record<string, any>;
}

export function DataFetchExample({ 
  tableName,
  initialFilters = {}
}: DataFetchExampleProps) {
  const [data, setData] = useState<DataItem[]>([]);
  const [newItem, setNewItem] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const { loading, error, queryData, insertData, updateData, deleteData } = useSupabase();
  
  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch data with current filters
  const fetchData = async () => {
    const result = await queryData<DataItem>(tableName, initialFilters);
    setData(result);
  };
  
  // Handle creating a new item
  const handleCreate = async () => {
    if (Object.keys(newItem).length === 0) return;
    
    const result = await insertData<DataItem>(tableName, newItem, '/');
    if (result) {
      setData(prev => [...prev, result]);
      setNewItem({});
    }
  };
  
  // Handle updating an existing item
  const handleUpdate = async (id: string | number, updatedData: Record<string, any>) => {
    const result = await updateData<DataItem>(tableName, id, updatedData, '/');
    if (result) {
      setData(prev => prev.map(item => item.id === id ? result : item));
      setEditingId(null);
    }
  };
  
  // Handle deleting an item
  const handleDelete = async (id: string | number) => {
    const success = await deleteData(tableName, id, '/');
    if (success) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };
  
  // Generate a simple form for the data structure
  const renderForm = (item: Record<string, any> = {}, isNew = false) => {
    // Get fields from the first data item or use an empty object
    const fields = data.length > 0 
      ? Object.keys(data[0]).filter(key => key !== 'id') 
      : Object.keys(item).filter(key => key !== 'id');
    
    return (
      <div className="space-y-4 p-4 border rounded-md">
        {isNew && <h3 className="font-medium">Add New Item</h3>}
        {!isNew && <h3 className="font-medium">Edit Item</h3>}
        
        <div className="space-y-2">
          {fields.map(field => (
            <div key={field} className="flex flex-col">
              <label className="text-sm text-muted-foreground">{field}</label>
              <input
                type="text"
                value={item[field] || ''}
                onChange={(e) => {
                  if (isNew) {
                    setNewItem({ ...newItem, [field]: e.target.value });
                  } else {
                    const updated = { ...item, [field]: e.target.value };
                    setData(data.map(d => d.id === item.id ? updated as DataItem : d));
                  }
                }}
                className="border rounded p-2 text-sm"
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2">
          {!isNew && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditingId(null)}
            >
              Cancel
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => {
              if (isNew) {
                handleCreate();
              } else {
                handleUpdate(item.id, item);
              }
            }}
            disabled={loading}
          >
            {isNew ? 'Create' : 'Update'}
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Data: {tableName}</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {loading && <p className="text-sm">Loading...</p>}
      
      {/* Data table */}
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(data[0]).map(key => (
                  <th 
                    key={key} 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                editingId === item.id ? (
                  <tr key={`edit-${item.id}`}>
                    <td colSpan={Object.keys(data[0]).length + 1} className="px-4 py-2">
                      {renderForm(item, false)}
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    {Object.entries(item).map(([key, value]) => (
                      <td key={`${item.id}-${key}`} className="px-4 py-2 text-sm">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-sm">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingId(item.id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No data available</p>
      )}
      
      {/* New item form */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Add New Item</h3>
        {renderForm(newItem, true)}
      </div>
    </div>
  );
} 