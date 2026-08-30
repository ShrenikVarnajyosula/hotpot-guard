export interface Campaign {
  id: string;
  name: string;
  category: string;
  text: string;
  severity: number;
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "PWR-402",
    name: "National Power Syndicate #402",
    category: "Fake Utility Disconnection / APK Trojan",
    severity: 95,
    text: "Dear customer your electricity power will be disconnected tonight 9:30 pm because your previous month bill was not updated. please immediately contact our electricity officer 9876543210 download bijli update apk to pay bill urgent disconnection",
  },
  {
    id: "TG-118",
    name: "Telegram Task/Rating Job Ring #118",
    category: "Part-Time Job / Task Prepaid Fraud",
    severity: 92,
    text: "hello i am hr from digital marketing company part time job online rating hotel google review earn 5000 daily join telegram group complete prepaid task deposit money to receive commission upi transfer merchant task",
  },
  {
    id: "KYC-77",
    name: "Bank KYC Suspension Wave #77",
    category: "Bank KYC Phishing / Account Suspension",
    severity: 90,
    text: "dear user your bank account will be suspended today kyc pan card update pending click link to update netbanking login otp share cif number account block immediately verify aadhaar",
  },
  {
    id: "TRAI-204",
    name: "TRAI Parcel Impersonation #204",
    category: "Law Enforcement Impersonation / Digital Arrest",
    severity: 97,
    text: "this call is from trai your mobile number will be disconnected in 2 hours illegal activity parcel containing drugs seized by mumbai police digital arrest skype video call cbi officer transfer money to verify account rbi",
  },
  {
    id: "FEDEX-311",
    name: "FedEx Customs Clearance Fraud #311",
    category: "Courier Customs Fee Scam",
    severity: 88,
    text: "your fedex parcel is held at customs pay small clearance fee to release shipment package contains illegal items call customs officer immediately pay via upi link tracking suspended",
  },
  {
    id: "APK-501",
    name: "Remote Access Trojan Dropper #501",
    category: "Malicious APK / Remote Access Trojan",
    severity: 98,
    text: "download the apk file attached install and open app allow permissions sms access to complete verification whatsapp apk pdf apk update banking app from this link not from play store",
  },
  {
    id: "UPI-620",
    name: "UPI Collect Request Reversal Ring #620",
    category: "UPI Reverse Payment Fraud",
    severity: 86,
    text: "i sent money to your upi by mistake please accept the collect request and enter your upi pin to return the amount scan this qr code to receive money refund pending approve request",
  },
  {
    id: "LOT-133",
    name: "KBC Lottery Prize Scam #133",
    category: "Lottery / Prize Advance Fee",
    severity: 84,
    text: "congratulations you have won 25 lakh rupees kbc lucky draw lottery whatsapp winner send processing fee gst charges to claim prize money share aadhaar bank details",
  },
  {
    id: "INV-455",
    name: "Fake Trading & Crypto Platform #455",
    category: "Investment / Crypto Ponzi",
    severity: 91,
    text: "guaranteed returns stock trading tips group vip investment app deposit minimum 10000 double profit crypto usdt withdrawal blocked pay tax to withdraw funds portfolio manager",
  },
  {
    id: "SIM-208",
    name: "SIM Swap & OTP Harvest #208",
    category: "OTP / SIM Swap Social Engineering",
    severity: 93,
    text: "share the otp received on your mobile number for verification our executive will call do not disconnect sim card upgrade 5g forward call activate anydesk teamviewer screen share",
  },
  {
    id: "GOV-090",
    name: "Fake Government Subsidy Portal #090",
    category: "Government Scheme Phishing",
    severity: 82,
    text: "pm yojana subsidy scheme free amount credited apply now government portal registration link fill form aadhaar bank account beneficiary list last date today",
  },
  {
    id: "SAFE-000",
    name: "Legitimate Transactional Notice",
    category: "Benign",
    severity: 5,
    text: "your order has been shipped and will be delivered today tracking id available on our official website no payment is required for delivery thank you for shopping with us customer care support",
  },
];
