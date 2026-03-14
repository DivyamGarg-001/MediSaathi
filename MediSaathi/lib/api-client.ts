// API Client for MediSaathi Frontend
// Centralized HTTP client with error handling and authentication

class ApiClient {
  private baseURL: string
  private defaultHeaders: HeadersInit

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com/api' 
      : '/api'
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ data: T | null, error: any, success: boolean }> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      }

      const response = await fetch(url, config)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      return result
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    }
  }

  // User Management APIs
  users = {
    getCurrentProfile: () => this.request('/users?action=profile'),
    
    signUp: (userData: any) => this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'signup', userData })
    }),
    
    signIn: (credentials: any) => this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'signin', userData: credentials })
    }),
    
    signOut: () => this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'signout' })
    }),
    
    updateProfile: (userId: string, updates: any) => this.request('/users', {
      method: 'PUT',
      body: JSON.stringify({ userId, updates })
    }),
    
    searchUsers: (query: string, type?: string) => 
      this.request(`/users?action=search&q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
  }

  // Family Members APIs
  family = {
    getMembers: (userId: string) => this.request(`/family-members?userId=${userId}`),
    
    getMember: (userId: string, memberId: string) => 
      this.request(`/family-members?userId=${userId}&memberId=${memberId}`),
    
    addMember: (memberData: any) => this.request('/family-members', {
      method: 'POST',
      body: JSON.stringify({ memberData })
    }),
    
    updateMember: (memberId: string, updates: any) => this.request('/family-members', {
      method: 'PUT',
      body: JSON.stringify({ memberId, updates })
    }),
    
    deleteMember: (memberId: string) => this.request(`/family-members?memberId=${memberId}`, {
      method: 'DELETE'
    }),
  }

  // Health Records APIs
  healthRecords = {
    getRecords: (userId: string, familyMemberId?: string) => 
      this.request(`/health-records?action=get-records&userId=${userId}${familyMemberId ? `&familyMemberId=${familyMemberId}` : ''}`),
    
    getRecord: (recordId: string) => 
      this.request(`/health-records?action=get-record&recordId=${recordId}`),
    
    getRecordsByType: (userId: string, type: string) => 
      this.request(`/health-records?action=by-type&userId=${userId}&type=${type}`),
    
    searchRecords: (userId: string, query: string) => 
      this.request(`/health-records?action=search&userId=${userId}&q=${encodeURIComponent(query)}`),
    
    getCriticalRecords: (userId: string) => 
      this.request(`/health-records?action=critical&userId=${userId}`),
    
    getAnalytics: (userId: string) => 
      this.request(`/health-records?action=analytics&userId=${userId}`),
    
    addRecord: (recordData: any) => this.request('/health-records', {
      method: 'POST',
      body: JSON.stringify({ action: 'add-record', recordData })
    }),
    
    uploadFile: async (recordData: any, file: File) => {
      try {
        const formData = new FormData()
        Object.entries(recordData || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value))
          }
        })
        formData.append('file', file)

        const response = await fetch(`${this.baseURL}/health-records`, {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || `HTTP error! status: ${response.status}`)
        }

        return result
      } catch (error) {
        console.error('API Error [/health-records uploadFile]:', error)
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        }
      }
    },
    
    updateRecord: (recordId: string, updates: any) => this.request('/health-records', {
      method: 'PUT',
      body: JSON.stringify({ recordId, updates })
    }),
    
    deleteRecord: (recordId: string) => this.request(`/health-records?recordId=${recordId}`, {
      method: 'DELETE'
    }),
  }

  // Vital Signs APIs
  vitals = {
    getVitals: (userId: string, familyMemberId?: string, type?: string) => 
      this.request(`/vital-signs?action=get-vitals&userId=${userId}${familyMemberId ? `&familyMemberId=${familyMemberId}` : ''}${type ? `&type=${type}` : ''}`),
    
    getLatestReadings: (userId: string, familyMemberId?: string) => 
      this.request(`/vital-signs?action=latest-readings&userId=${userId}${familyMemberId ? `&familyMemberId=${familyMemberId}` : ''}`),
    
    getAnalytics: (userId: string, type: string, days?: number) => 
      this.request(`/vital-signs?action=analytics&userId=${userId}&type=${type}${days ? `&days=${days}` : ''}`),
    
    getReminders: (userId: string) => 
      this.request(`/vital-signs?action=reminders&userId=${userId}`),
    
    addReading: (vitalData: any) => this.request('/vital-signs', {
      method: 'POST',
      body: JSON.stringify({ vitalData })
    }),
    
    updateReading: (vitalId: string, updates: any) => this.request('/vital-signs', {
      method: 'PUT',
      body: JSON.stringify({ vitalId, updates })
    }),
    
    deleteReading: (vitalId: string) => this.request(`/vital-signs?vitalId=${vitalId}`, {
      method: 'DELETE'
    }),
  }

  // Emergency SOS APIs
  emergencySos = {
    getSnapshot: (userId: string) => this.request(`/emergency-sos?userId=${userId}`),
  }

  // Appointments APIs
  appointments = {
    getPatientAppointments: (userId: string, status?: string) => 
      this.request(`/appointments?action=patient-appointments&userId=${userId}${status ? `&status=${status}` : ''}`),
    
    getDoctorAppointments: (doctorId: string, date?: string) => 
      this.request(`/appointments?action=doctor-appointments&doctorId=${doctorId}${date ? `&date=${date}` : ''}`),
    
    getHospitalAppointments: (hospitalId: string, date?: string) => 
      this.request(`/appointments?action=hospital-appointments&hospitalId=${hospitalId}${date ? `&date=${date}` : ''}`),
    
    getAvailableSlots: (doctorId: string, date: string) => 
      this.request(`/appointments?action=available-slots&doctorId=${doctorId}&date=${date}`),
    
    getUpcoming: (userId: string, userType: 'patient' | 'doctor') => 
      this.request(`/appointments?action=upcoming&userId=${userId}&userType=${userType}`),
    
    getStats: (doctorId?: string, hospitalId?: string, startDate?: string, endDate?: string) => {
      const params = new URLSearchParams({ action: 'stats' })
      if (doctorId) params.append('doctorId', doctorId)
      if (hospitalId) params.append('hospitalId', hospitalId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      return this.request(`/appointments?${params}`)
    },
    
    bookAppointment: (appointmentData: any) => this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify({ action: 'book', appointmentData })
    }),
    
    updateAppointment: (appointmentId: string, updates: any) => this.request('/appointments', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update', appointmentId, updates })
    }),
    
    cancelAppointment: (appointmentId: string, reason?: string) => this.request('/appointments', {
      method: 'PUT',
      body: JSON.stringify({ action: 'cancel', appointmentId, reason })
    }),
  }

  // Doctors APIs
  doctors = {
    getByUser: (userId: string) => this.request(`/doctors?action=get-by-user&userId=${userId}`),
    
    getDoctor: (doctorId: string) => this.request(`/doctors?action=get-doctor&doctorId=${doctorId}`),
    
    search: (query?: string, specialty?: string, hospitalId?: string) => {
      const params = new URLSearchParams({ action: 'search' })
      if (query) params.append('q', query)
      if (specialty) params.append('specialty', specialty)
      if (hospitalId) params.append('hospitalId', hospitalId)
      return this.request(`/doctors?${params}`)
    },
    
    getByHospital: (hospitalId: string) => this.request(`/doctors?action=by-hospital&hospitalId=${hospitalId}`),
    
    getPatients: (doctorId: string) => this.request(`/doctors?action=patients&doctorId=${doctorId}`),
    
    getStats: (doctorId: string) => this.request(`/doctors?action=stats&doctorId=${doctorId}`),
    
    getSpecialties: () => this.request('/doctors?action=specialties'),
    
    getTopRated: (limit?: number) => this.request(`/doctors?action=top-rated${limit ? `&limit=${limit}` : ''}`),
    
    checkAvailability: (doctorId: string, date: string, time: string) => 
      this.request(`/doctors?action=check-availability&doctorId=${doctorId}&date=${date}&time=${time}`),
    
    createProfile: (doctorData: any) => this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', doctorData })
    }),
    
    updateProfile: (doctorId: string, updates: any) => this.request('/doctors', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update', doctorId, updates })
    }),
    
    updateRating: (doctorId: string, rating: number) => this.request('/doctors', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update-rating', doctorId, rating })
    }),
  }

  // Hospitals APIs
  hospitals = {
    getByUser: (userId: string) => this.request(`/hospitals?action=get-by-user&userId=${userId}`),
    
    getHospital: (hospitalId: string) => this.request(`/hospitals?action=get-hospital&hospitalId=${hospitalId}`),
    
    search: (query?: string, services?: string[], emergencyServices?: boolean) => {
      const params = new URLSearchParams({ action: 'search' })
      if (query) params.append('q', query)
      if (services) params.append('services', services.join(','))
      if (emergencyServices !== undefined) params.append('emergencyServices', emergencyServices.toString())
      return this.request(`/hospitals?${params}`)
    },
    
    getAll: () => this.request('/hospitals?action=all'),
    
    getStats: (hospitalId: string) => this.request(`/hospitals?action=stats&hospitalId=${hospitalId}`),
    
    getWithBeds: (minimumBeds?: number) => 
      this.request(`/hospitals?action=with-beds${minimumBeds ? `&minimumBeds=${minimumBeds}` : ''}`),
    
    getByService: (service: string) => this.request(`/hospitals?action=by-service&service=${service}`),
    
    getEmergency: () => this.request('/hospitals?action=emergency'),
    
    getDepartments: (hospitalId: string) => this.request(`/hospitals?action=departments&hospitalId=${hospitalId}`),
    
    getTopRated: (limit?: number) => this.request(`/hospitals?action=top-rated${limit ? `&limit=${limit}` : ''}`),
    
    getOccupancy: (hospitalId: string) => this.request(`/hospitals?action=occupancy&hospitalId=${hospitalId}`),
    
    createProfile: (hospitalData: any) => this.request('/hospitals', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', hospitalData })
    }),
    
    updateProfile: (hospitalId: string, updates: any) => this.request('/hospitals', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update', hospitalId, updates })
    }),
    
    updateBeds: (hospitalId: string, availableBeds: number) => this.request('/hospitals', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update-beds', hospitalId, availableBeds })
    }),
    
    updateServices: (hospitalId: string, services: string[]) => this.request('/hospitals', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update-services', hospitalId, services })
    }),
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types for TypeScript
export type ApiResponse<T> = {
  data: T | null
  error: any
  success: boolean
  message?: string
}