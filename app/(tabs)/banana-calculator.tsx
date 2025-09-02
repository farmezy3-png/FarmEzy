import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface BananaRow {
  id: string;
  type: string;
  weight: string;
  pricePerKg: string;
  amount: number;
}

const BananaCalculator: React.FC = () => {
  const [rows, setRows] = useState<BananaRow[]>([
    { id: '1', type: '', weight: '', pricePerKg: '', amount: 0 }
  ]);
  const [billNumber, setBillNumber] = useState<string>('');
  const [farmerName, setFarmerName] = useState<string>('');
  const router = useRouter();

  // Generate unique bill number
  const generateBillNumber = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `FB${timestamp.toString().slice(-6)}${randomNum.toString().padStart(3, '0')}`;
  };

  // Load user data and generate bill number on mount
  React.useEffect(() => {
    loadUserData();
    setBillNumber(generateBillNumber());
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setFarmerName(user.username || 'Farmer');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const calculateAmount = (weight: string, pricePerKg: string): number => {
    const weightNum = parseFloat(weight) || 0;
    const priceNum = parseFloat(pricePerKg) || 0;
    return weightNum * priceNum;
  };

  const updateRow = (id: string, field: keyof BananaRow, value: string) => {
    setRows(prevRows => 
      prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          // Recalculate amount when weight or price changes
          if (field === 'weight' || field === 'pricePerKg') {
            updatedRow.amount = calculateAmount(updatedRow.weight, updatedRow.pricePerKg);
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const addNewRow = () => {
    const newId = (rows.length + 1).toString();
    setRows(prevRows => [
      ...prevRows,
      { id: newId, type: '', weight: '', pricePerKg: '', amount: 0 }
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(prevRows => prevRows.filter(row => row.id !== id));
    } else {
      Alert.alert('Error', 'At least one row is required');
    }
  };

  const getTotalAmount = (): number => {
    return rows.reduce((total, row) => total + row.amount, 0);
  };

  const resetCalculator = () => {
    setRows([{ id: '1', type: '', weight: '', pricePerKg: '', amount: 0 }]);
    setBillNumber(generateBillNumber());
  };

  const generateBillHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    const totalWeight = rows.reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0);
    const totalAmount = getTotalAmount();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Banana Purchase Bill</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #fff;
            }
            .header {
              text-align: center;
              background: linear-gradient(135deg, #FFB300, #FF8F00);
              color: white;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .tagline {
              font-size: 16px;
              opacity: 0.9;
            }
            .bill-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            .bill-details, .farmer-details {
              flex: 1;
            }
            .bill-details h3, .farmer-details h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .bill-details p, .farmer-details p {
              margin: 5px 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              background-color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th {
              background: linear-gradient(135deg, #FFB300, #FF8F00);
              color: white;
              padding: 15px;
              text-align: center;
              font-weight: bold;
            }
            td {
              padding: 12px 15px;
              text-align: center;
              border-bottom: 1px solid #eee;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .amount-cell {
              background-color: #e8f5e8 !important;
              color: #2e7d32;
              font-weight: bold;
            }
            .summary {
              background-color: #f0f8ff;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary h3 {
              margin: 0 0 15px 0;
              color: #333;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 5px 0;
              border-bottom: 1px solid #ddd;
            }
            .total-section {
              background: linear-gradient(135deg, #4CAF50, #45A049);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              margin-bottom: 20px;
            }
            .total-amount {
              font-size: 32px;
              font-weight: bold;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(255, 179, 0, 0.1);
              z-index: -1;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div class="watermark">🍌</div>
          
          <div class="header">
            <div class="company-name">🍌 FarmEzy</div>
            <div class="tagline">Smart Farming Solutions</div>
          </div>

          <div class="bill-info">
            <div class="bill-details">
              <h3>Bill Details</h3>
              <p><strong>Bill No:</strong> ${billNumber}</p>
              <p><strong>Date:</strong> ${currentDate}</p>
              <p><strong>Time:</strong> ${currentTime}</p>
            </div>
            <div class="farmer-details">
              <h3>Farmer Details</h3>
              <p><strong>Name:</strong> ${farmerName}</p>
              <p><strong>Type:</strong> Banana Supplier</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Banana Type</th>
                <th>Weight (kg)</th>
                <th>Price per kg (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${row.type || 'N/A'}</td>
                  <td>${row.weight || '0'}</td>
                  <td>₹${row.pricePerKg || '0'}</td>
                  <td class="amount-cell">₹${row.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Summary</h3>
            <div class="summary-row">
              <span>Total Items:</span>
              <span>${rows.length}</span>
            </div>
            <div class="summary-row">
              <span>Total Weight:</span>
              <span>${totalWeight.toFixed(2)} kg</span>
            </div>
            <div class="summary-row">
              <span>Average Price per kg:</span>
              <span>₹${rows.length > 0 ? (rows.reduce((sum, row) => sum + (parseFloat(row.pricePerKg) || 0), 0) / rows.length).toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div class="total-section">
            <h2>Total Amount</h2>
            <div class="total-amount">₹${totalAmount.toFixed(2)}</div>
            <p>Amount in words: ${numberToWords(totalAmount)} Rupees Only</p>
          </div>

          <div class="footer">
            <p>Generated by FarmEzy - Smart Farming Solutions</p>
            <p>Thank you for your business!</p>
            <p style="margin-top: 10px; font-size: 10px;">This is a computer generated bill</p>
          </div>
        </body>
      </html>
    `;
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    const convertHundreds = (n: number): string => {
      let result = '';
      if (n > 99) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n > 9) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    if (num < 1000) {
      return convertHundreds(num).trim();
    }

    let result = '';
    let thousandCounter = 0;
    
    while (num > 0) {
      if (num % 1000 !== 0) {
        result = convertHundreds(num % 1000) + thousands[thousandCounter] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      thousandCounter++;
    }
    
    return result.trim();
  };

  const generateBill = async () => {
    console.log('Generate Bill button pressed!'); // Debug log
    
    if (rows.every(row => !row.type && !row.weight && !row.pricePerKg)) {
      Alert.alert('Error', 'Please add at least one item to generate the bill');
      return;
    }

    try {
      console.log('Starting PDF generation...'); // Debug log
      
      const htmlContent = generateBillHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('PDF generated at:', uri); // Debug log

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Banana Bill',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Bill generated successfully!', [
          {
            text: 'OK',
            onPress: () => console.log('PDF saved at:', uri),
          },
        ]);
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      Alert.alert('Error', 'Failed to generate bill. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8F00" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FFB300', '#FF8F00']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.bananaIcon}>🍌</Text>
            <Text style={styles.headerTitle}>Banana Calculator</Text>
          </View>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetCalculator}
          >
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to use:</Text>
          <Text style={styles.instructionsText}>
            Enter banana type, weight (kg), and price per kg for each batch. 
            The amount will be calculated automatically.
          </Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.typeHeader]}>Type</Text>
          <Text style={[styles.headerCell, styles.weightHeader]}>Weight (kg)</Text>
          <Text style={[styles.headerCell, styles.priceHeader]}>Price/kg (₹)</Text>
          <Text style={[styles.headerCell, styles.amountHeader]}>Amount (₹)</Text>
          <View style={styles.actionHeader} />
        </View>

        {/* Data Rows */}
        <View style={styles.tableContainer}>
          {rows.map((row, index) => (
            <View key={row.id} style={styles.tableRow}>
              <TextInput
                style={[styles.input, styles.typeInput]}
                placeholder="e.g. Robusta"
                placeholderTextColor="#999"
                value={row.type}
                onChangeText={(text) => updateRow(row.id, 'type', text)}
              />
              
              <TextInput
                style={[styles.input, styles.weightInput]}
                placeholder="0"
                placeholderTextColor="#999"
                value={row.weight}
                onChangeText={(text) => updateRow(row.id, 'weight', text)}
                keyboardType="numeric"
              />
              
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="0"
                placeholderTextColor="#999"
                value={row.pricePerKg}
                onChangeText={(text) => updateRow(row.id, 'pricePerKg', text)}
                keyboardType="numeric"
              />
              
              <View style={styles.amountCell}>
                <Text style={styles.amountText}>
                  ₹{row.amount.toFixed(2)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeRow(row.id)}
              >
                <Icon name="delete" size={20} color="#FF5252" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add Row Button */}
        <TouchableOpacity style={styles.addButton} onPress={addNewRow}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.addButtonGradient}
          >
            <Icon name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Row</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Generate Bill Button - Test Version */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.generateBillButton} onPress={generateBill}>
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.generateBillGradient}
            >
              <Icon name="picture-as-pdf" size={24} color="white" />
              <Text style={styles.generateBillText}>Generate PDF Bill</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.totalCard}>
          <LinearGradient
            colors={['#FFB300', '#FF8F00']}
            style={styles.totalGradient}
          >
            <View style={styles.totalContent}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{getTotalAmount().toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Preview</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bill Number:</Text>
            <Text style={styles.summaryValue}>{billNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Farmer Name:</Text>
            <Text style={styles.summaryValue}>{farmerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{rows.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Weight:</Text>
            <Text style={styles.summaryValue}>
              {rows.reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0).toFixed(2)} kg
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average Price/kg:</Text>
            <Text style={styles.summaryValue}>
              ₹{rows.length > 0 ? 
                (rows.reduce((sum, row) => sum + (parseFloat(row.pricePerKg) || 0), 0) / rows.length).toFixed(2) 
                : '0.00'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  bananaIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  resetButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8F00',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFB300',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  typeHeader: {
    flex: 2.5,
  },
  weightHeader: {
    flex: 2,
  },
  priceHeader: {
    flex: 2,
  },
  amountHeader: {
    flex: 2.5,
  },
  actionHeader: {
    width: 40,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F8F8F8',
    textAlign: 'center',
  },
  typeInput: {
    flex: 2.5,
    marginRight: 4,
    textAlign: 'left',
  },
  weightInput: {
    flex: 2,
    marginHorizontal: 2,
  },
  priceInput: {
    flex: 2,
    marginHorizontal: 2,
  },
  amountCell: {
    flex: 2.5,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    marginLeft: 2,
    marginRight: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  deleteButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addButton: {
    marginTop: 16,
    marginBottom: 20,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  generateBillButton: {
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  generateBillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  generateBillText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  totalGradient: {
    padding: 24,
  },
  totalContent: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomPadding: {
    height: 20,
  },
});

export default BananaCalculator;