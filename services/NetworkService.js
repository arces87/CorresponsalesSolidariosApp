import NetInfo from '@react-native-community/netinfo';

export default class NetworkService {
  static async checkConnection() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }
}
