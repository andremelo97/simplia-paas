import { api as http } from '@client/config/http'

export interface MediaLibraryItem {
  id: number
  url: string
  filename: string
  originalFilename: string
  mediaType: 'image' | 'video'
  mimeType: string
  fileSize: number
  altText?: string
  createdAt: string
}

export interface MediaLibraryResponse {
  data: MediaLibraryItem[]
  meta: {
    count: number
    limit: number
    remaining: number
  }
}

export const mediaLibraryService = {
  /**
   * Get media library files
   * Uses the Internal API via proxy
   * @param type - Optional filter: 'image' or 'video'
   */
  getMediaLibrary: async (type?: 'image' | 'video'): Promise<MediaLibraryResponse> => {
    const params = type ? `?type=${type}` : ''
    const response = await http.get(`/internal/api/v1/configurations/branding/media-library${params}`)
    return response.data
  },
}
