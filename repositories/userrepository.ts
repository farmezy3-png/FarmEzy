import {
  fetchUserDetails,
  manageUserDetails
} from '../services/firestore';

class UserRepository {
  /**
   * Save user details
   */
  async saveuser(data : any) {
    console.log('Saving user details in saveuser:', data);
    return await manageUserDetails(data);
  }

  /**
   * fetch user details
   * @returns 
   */

   async getUser() {
    return await fetchUserDetails();
  } 

}
export default new UserRepository();