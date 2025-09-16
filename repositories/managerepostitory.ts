// repositories/BananaWeightRepository.js

import {
  fetchBananaWeightDetails,
  fetchBananaWeightsByMobile,
  manageBananaWeightDetails
} from '../services/firestore';

class BananaWeightRepository {
  /**
   * Save banana weight data
   * @param {Object} data
   * @returns {Promise<string>} - Firestore document ID
   */
  async save(data : any): Promise<any> {
    return await manageBananaWeightDetails(data);
  }

  /**
   * Get all banana weight records
   * @returns {Promise<Array>}
   */
  async getAll(): Promise<Array<any>> {
    return await fetchBananaWeightDetails();
  } 

  /**
   * Get banana weight records by contact number
   * @param {string} contactNumber
   * @returns {Promise<Array>}
   */
  async getByContactNumber(contactNumber : any): Promise<Array<any>> {
    return await fetchBananaWeightsByMobile(contactNumber);
  }  

}

export default new BananaWeightRepository();
