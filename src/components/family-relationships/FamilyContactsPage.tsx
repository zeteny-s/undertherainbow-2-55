import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Mail, Search, Users } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmailCampaignModal } from './EmailCampaignModal';

interface FamilyContact {
  id: string;
  child_name: string;
  campus: string;
  group_name: string;
  mother_email: string | null;
  father_email: string | null;
  additional_emails: string[] | null;
  notes: string | null;
  created_at: string;
}

export const FamilyContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<FamilyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const campuses = ['Torockó', 'Feketerigó', 'Levél'];
  
  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery, campusFilter, groupFilter]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('family_contacts')
        .select('*')
        .order('child_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching family contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(contact =>
        contact.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.mother_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.father_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.group_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Campus filter
    if (campusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.campus === campusFilter);
    }

    // Group filter
    if (groupFilter !== 'all') {
      filtered = filtered.filter(contact => contact.group_name === groupFilter);
    }

    setFilteredContacts(filtered);
  };

  const getUniqueGroups = () => {
    const groups = [...new Set(contacts.map(contact => contact.group_name))];
    return groups.sort();
  };

  const getContactEmails = (contact: FamilyContact): string[] => {
    const emails = [];
    if (contact.mother_email) emails.push(contact.mother_email);
    if (contact.father_email) emails.push(contact.father_email);
    if (contact.additional_emails) emails.push(...contact.additional_emails);
    return emails;
  };

  const getAllSelectedEmails = (): string[] => {
    const contactsToEmail = selectedContacts.length > 0 
      ? filteredContacts.filter(contact => selectedContacts.includes(contact.id))
      : filteredContacts;
    
    const allEmails = contactsToEmail.flatMap(contact => getContactEmails(contact));
    return [...new Set(allEmails)]; // Remove duplicates
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Family Contacts</h1>
          <p className="text-gray-600">
            Manage and communicate with kindergarten families
          </p>
        </div>
        <button 
          onClick={() => setShowEmailModal(true)}
          disabled={filteredContacts.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
          Send Email Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by child name, email, or group..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg px-10 py-2"
            />
          </div>
          <select 
            value={campusFilter} 
            onChange={(e) => setCampusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Campuses</option>
            {campuses.map(campus => (
              <option key={campus} value={campus}>{campus}</option>
            ))}
          </select>
          <select 
            value={groupFilter} 
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Groups</option>
            {getUniqueGroups().map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50"
            >
              {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedContacts.length > 0 && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                {selectedContacts.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            {filteredContacts.length} families
          </div>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => (
          <div 
            key={contact.id} 
            className={`bg-white rounded-lg border shadow-sm p-4 cursor-pointer transition-colors ${
              selectedContacts.includes(contact.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSelectContact(contact.id)}
          >
            <div className="mb-3">
              <h3 className="text-lg font-semibold">{contact.child_name}</h3>
              <div className="flex gap-2 mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{contact.campus}</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{contact.group_name}</span>
              </div>
            </div>
            <div className="space-y-2">
              {contact.mother_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">Mother:</span>
                  <span className="truncate">{contact.mother_email}</span>
                </div>
              )}
              {contact.father_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">Father:</span>
                  <span className="truncate">{contact.father_email}</span>
                </div>
              )}
              {contact.additional_emails && contact.additional_emails.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">Additional:</span>
                  <span>{contact.additional_emails.length} more</span>
                </div>
              )}
              {contact.notes && (
                <p className="text-sm text-gray-500 mt-2">{contact.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No families found</h3>
          <p className="text-gray-500">
            {contacts.length === 0 
              ? "No family contacts have been added yet."
              : "No families match the current filters."
            }
          </p>
        </div>
      )}

      <EmailCampaignModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipients={getAllSelectedEmails()}
        selectedFamilies={selectedContacts.length > 0 ? selectedContacts.length : filteredContacts.length}
      />
    </div>
  );
};