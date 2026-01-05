'use client';

import { supabase } from './supabase';

/**
 * Get auth headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error.message);
    }
    
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };
    } else {
      console.log('No active session found for auth headers');
    }
  } catch (error) {
    console.error('Failed to get auth session:', error);
  }
  
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Make an authenticated fetch request
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

/**
 * Make an authenticated GET request
 */
export async function authGet<T = unknown>(url: string): Promise<T> {
  const response = await authFetch(url);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

/**
 * Make an authenticated POST request
 */
export async function authPost<T = unknown>(url: string, body: object): Promise<T> {
  const response = await authFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}
