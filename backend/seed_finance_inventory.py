import datetime
import random
from core.models import User
from clients.models import Client
from projects.models import Project
from finance.models import Income, Expense, Invoice
from inventory.models import EquipmentAsset, StockItem, AssetStatus

def seed():
    print("Seeding Finance & Inventory data...")
    users = {u.username: u for u in User.objects.all()}
    clients = list(Client.objects.all())
    projects = list(Project.objects.all())

    arun = users.get('arun_founder')
    priya = users.get('priya_ceo')
    rahul = users.get('rahul_manager')
    divya = users.get('divya_head')
    rohan = users.get('rohan_dev')
    kavya = users.get('kavya_intern')

    # 1. SEED INCOMES
    if Income.objects.count() < 4:
        c1 = clients[0] if clients else None
        c2 = clients[1] if len(clients) > 1 else c1

        incomes = [
            {
                'reference': 'INC-2026-001',
                'title': 'Enterprise ERP Platform - Phase 1 Milestone',
                'category': 'Client Invoice',
                'client': c1,
                'amount': 350000.00,
                'payment_method': 'Bank Transfer',
                'payment_date': datetime.date(2026, 9, 2),
                'status': 'Received',
                'notes': 'NEFT Bank transfer cleared from Apex Corporation'
            },
            {
                'reference': 'INC-2026-002',
                'title': 'Social Media Marketing - Monthly Retainer (Sep)',
                'category': 'Marketing Retainer',
                'client': c2,
                'amount': 85000.00,
                'payment_method': 'UPI / QR',
                'payment_date': datetime.date(2026, 9, 3),
                'status': 'Received',
                'notes': '12 Reels & 15 Static Posts retainer fee'
            },
            {
                'reference': 'INC-2026-003',
                'title': 'AI Workflow Architecture - Technical Consulting',
                'category': 'Consultation & Advisory',
                'client': c1,
                'amount': 120000.00,
                'payment_method': 'Bank Transfer',
                'payment_date': datetime.date(2026, 9, 5),
                'status': 'Received',
                'notes': 'Executive architecture review & roadmap'
            },
            {
                'reference': 'INC-2026-004',
                'title': 'Annual Cloud Infrastructure Maintenance (AMC)',
                'category': 'AMC & Maintenance',
                'client': c2,
                'amount': 65000.00,
                'payment_method': 'Credit Card',
                'payment_date': datetime.date(2026, 9, 6),
                'status': 'Received',
                'notes': 'Annual 24/7 SLA maintenance contract'
            },
            {
                'reference': 'INC-2026-005',
                'title': 'Custom Mobile App MVP Delivery',
                'category': 'Software Development',
                'client': c1,
                'amount': 180000.00,
                'payment_method': 'Bank Transfer',
                'payment_date': datetime.date(2026, 8, 28),
                'status': 'Received',
                'notes': 'Final milestone payment'
            },
            {
                'reference': 'INC-2026-006',
                'title': 'Brand Identity & Video Production Package',
                'category': 'Marketing Retainer',
                'client': c2,
                'amount': 95000.00,
                'payment_method': 'Online Gateway',
                'payment_date': datetime.date(2026, 8, 15),
                'status': 'Received',
                'notes': 'Razorpay corporate payment'
            },
        ]
        for inc_data in incomes:
            Income.objects.get_or_create(reference=inc_data['reference'], defaults=inc_data)
        print(f"Incomes seeded. Total: {Income.objects.count()}")

    # 2. SEED EXPENSES
    if Expense.objects.count() < 4:
        expenses = [
            {
                'reference': 'EXP-2026-001',
                'title': 'AWS Cloud Infrastructure & Server Hosting',
                'category': 'Cloud & Hosting',
                'vendor_name': 'Amazon Web Services India',
                'amount': 28500.00,
                'tax_amount': 5130.00,
                'payment_method': 'Credit Card',
                'payment_date': datetime.date(2026, 9, 2),
                'status': 'Paid',
                'receipt_reference': 'AWS-INV-992140',
                'notes': 'EC2 instances, RDS Postgres, S3 media storage'
            },
            {
                'reference': 'EXP-2026-002',
                'title': 'Google Workspace & Gemini Business Subscriptions',
                'category': 'Software & Subscriptions',
                'vendor_name': 'Google Cloud India',
                'amount': 14200.00,
                'tax_amount': 2556.00,
                'payment_method': 'Credit Card',
                'payment_date': datetime.date(2026, 9, 1),
                'status': 'Paid',
                'receipt_reference': 'GOOG-WS-2026-09',
                'notes': 'Email, Drive, Meet for 15 group users'
            },
            {
                'reference': 'EXP-2026-003',
                'title': 'Corporate Office Lease & Workspace Rent (Sep 2026)',
                'category': 'Office Rent',
                'vendor_name': 'Olympia Tech Park Properties',
                'amount': 85000.00,
                'tax_amount': 15300.00,
                'payment_method': 'Bank Transfer',
                'payment_date': datetime.date(2026, 9, 1),
                'status': 'Paid',
                'receipt_reference': 'RENT-OTP-SEP26',
                'notes': 'Monthly rent for 3,200 sqft Development & Media Studio'
            },
            {
                'reference': 'EXP-2026-004',
                'title': 'Engineering & Staff Payroll (August Payout)',
                'category': 'Salaries & Payroll',
                'vendor_name': 'JRAM Groups Employee Payroll',
                'amount': 165000.00,
                'tax_amount': 0.00,
                'payment_method': 'Bank Transfer',
                'payment_date': datetime.date(2026, 9, 1),
                'status': 'Paid',
                'receipt_reference': 'SAL-BATCH-202608',
                'notes': 'Direct salary disbursement via HDFC Corporate Banking'
            },
            {
                'reference': 'EXP-2026-005',
                'title': 'High-Speed Leased Line Internet & Static IP',
                'category': 'Utilities & Internet',
                'vendor_name': 'Airtel Business Telecommunications',
                'amount': 6500.00,
                'tax_amount': 1170.00,
                'payment_method': 'UPI / QR',
                'payment_date': datetime.date(2026, 9, 4),
                'status': 'Paid',
                'receipt_reference': 'AIRTEL-BILL-44102',
                'notes': '500 Mbps symmetric dedicated 1:1 leased line'
            },
            {
                'reference': 'EXP-2026-006',
                'title': 'Meta Ads (Instagram / Facebook) Client Promotion',
                'category': 'Marketing & Ad Spend',
                'vendor_name': 'Meta Platforms Ireland',
                'amount': 32000.00,
                'tax_amount': 5760.00,
                'payment_method': 'Credit Card',
                'payment_date': datetime.date(2026, 9, 5),
                'status': 'Paid',
                'receipt_reference': 'FB-ADS-SEP05',
                'notes': 'Paid ads targeting healthcare and retail client campaigns'
            },
            {
                'reference': 'EXP-2026-007',
                'title': 'Contract 3D Motion Animator Payout',
                'category': 'Vendor & Freelancers',
                'vendor_name': 'Sanjay Varma (Visuals by Sanjay)',
                'amount': 22000.00,
                'tax_amount': 0.00,
                'payment_method': 'UPI / QR',
                'payment_date': datetime.date(2026, 9, 4),
                'status': 'Paid',
                'receipt_reference': 'INV-SANJAY-018',
                'notes': '3D product reveal renders for brand client'
            },
            {
                'reference': 'EXP-2026-008',
                'title': 'Pantry Supplies & Client Hospitality',
                'category': 'Travel & Refreshments',
                'vendor_name': 'Blue Tokai & Freshworks Pantry',
                'amount': 4500.00,
                'tax_amount': 0.00,
                'payment_method': 'Cash',
                'payment_date': datetime.date(2026, 9, 6),
                'status': 'Paid',
                'receipt_reference': 'PETTY-09-02',
                'notes': 'Artisanal coffee beans, snacks, pantry restocking'
            }
        ]
        for exp_data in expenses:
            Expense.objects.get_or_create(reference=exp_data['reference'], defaults=exp_data)
        print(f"Expenses seeded. Total: {Expense.objects.count()}")

    # 3. SEED EQUIPMENT ASSETS
    if EquipmentAsset.objects.count() < 4:
        assets = [
            {
                'asset_tag': 'EQP-MAC-001',
                'name': 'MacBook Pro 16" M3 Max (36GB RAM / 1TB SSD)',
                'category': 'Laptops & Workstations',
                'brand_model': 'Apple MacBook Pro M3 Max Space Black',
                'serial_number': 'C02XYZ982741',
                'assigned_to': arun,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 1, 15),
                'purchase_cost': 349900.00,
                'warranty_expiry': datetime.date(2028, 1, 14),
                'location': 'Executive Director Cabin',
                'notes': 'AppleCare+ active until Jan 2028'
            },
            {
                'asset_tag': 'EQP-MAC-002',
                'name': 'MacBook Air 15" M3 (16GB RAM / 512GB SSD)',
                'category': 'Laptops & Workstations',
                'brand_model': 'Apple MacBook Air 15 Midnight',
                'serial_number': 'C02M3AIR4421',
                'assigned_to': priya,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 2, 10),
                'purchase_cost': 154900.00,
                'warranty_expiry': datetime.date(2027, 2, 9),
                'location': 'CEO Suite',
                'notes': 'Executive business machine'
            },
            {
                'asset_tag': 'EQP-XPS-003',
                'name': 'Dell XPS 15 9530 (Intel Core i9 / RTX 4070 / 32GB)',
                'category': 'Laptops & Workstations',
                'brand_model': 'Dell XPS 15 OLED Touch',
                'serial_number': 'DELL-9530-9941',
                'assigned_to': rohan,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 3, 20),
                'purchase_cost': 224000.00,
                'warranty_expiry': datetime.date(2027, 3, 19),
                'location': 'Tech Development Bay',
                'notes': 'Primary development and compilation workstation'
            },
            {
                'asset_tag': 'EQP-THK-004',
                'name': 'Lenovo ThinkPad P16s Gen 2 (Ryzen 7 Pro / 32GB)',
                'category': 'Laptops & Workstations',
                'brand_model': 'Lenovo ThinkPad P16s',
                'serial_number': 'THNK-P16-3391',
                'assigned_to': divya,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 3, 25),
                'purchase_cost': 148000.00,
                'warranty_expiry': datetime.date(2027, 3, 24),
                'location': 'Team Lead Hub',
                'notes': 'Tech lead engineering workstation'
            },
            {
                'asset_tag': 'EQP-DSP-005',
                'name': 'Dell UltraSharp 32" 4K USB-C Hub Monitor (U3223QE)',
                'category': 'Monitors & Displays',
                'brand_model': 'Dell UltraSharp IPS Black',
                'serial_number': 'CN-0U3223-8821',
                'assigned_to': rohan,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 4, 5),
                'purchase_cost': 78500.00,
                'warranty_expiry': datetime.date(2029, 4, 4),
                'location': 'Dev Station 3',
                'notes': '3-year Dell advanced exchange warranty'
            },
            {
                'asset_tag': 'EQP-DSP-006',
                'name': 'LG UltraFine 27" 4K IPS Display (27UP850)',
                'category': 'Monitors & Displays',
                'brand_model': 'LG 27UP850-W',
                'serial_number': 'LG-4K-27UP-1102',
                'assigned_to': None,
                'status': 'Available',
                'purchase_date': datetime.date(2026, 5, 12),
                'purchase_cost': 36500.00,
                'warranty_expiry': datetime.date(2028, 5, 11),
                'location': 'HQ Tech Lab Inventory',
                'notes': 'Tested and ready for next hire deployment'
            },
            {
                'asset_tag': 'EQP-CAM-007',
                'name': 'Sony Alpha 7 IV Mirrorless Camera + 24-70mm GM Lens',
                'category': 'Studio & Media Cameras',
                'brand_model': 'Sony ILCE-7M4 + SEL2470GM2',
                'serial_number': 'SONY-A7M4-7741',
                'assigned_to': divya,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 4, 18),
                'purchase_cost': 385000.00,
                'warranty_expiry': datetime.date(2028, 4, 17),
                'location': 'Media & Content Production Studio',
                'notes': 'Used for social media client video production and reels'
            },
            {
                'asset_tag': 'EQP-LGT-008',
                'name': 'Aputure Amaran 200d Studio LED Light + Light Dome',
                'category': 'Audio & Lighting Gear',
                'brand_model': 'Amaran 200d Daylight LED',
                'serial_number': 'APTR-200D-5512',
                'assigned_to': None,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 4, 20),
                'purchase_cost': 38000.00,
                'warranty_expiry': datetime.date(2027, 4, 19),
                'location': 'Studio Room A',
                'notes': 'Permanent video lighting setup'
            },
            {
                'asset_tag': 'EQP-MIC-009',
                'name': 'Rode Wireless PRO Dual-Channel Wireless Mic System',
                'category': 'Audio & Lighting Gear',
                'brand_model': 'Rode Wireless PRO 32-bit Float',
                'serial_number': 'RODE-WPRO-3301',
                'assigned_to': None,
                'status': 'Available',
                'purchase_date': datetime.date(2026, 5, 2),
                'purchase_cost': 39900.00,
                'warranty_expiry': datetime.date(2027, 5, 1),
                'location': 'Media Equipment Locker',
                'notes': 'Complete with lavaliers and charging case'
            },
            {
                'asset_tag': 'EQP-NET-010',
                'name': 'Cisco Catalyst 24-Port Gigabit Managed PoE+ Switch',
                'category': 'Networking & Servers',
                'brand_model': 'Cisco C1000-24FP-4G-L',
                'serial_number': 'CSCO-CAT1000-88',
                'assigned_to': None,
                'status': 'In Use',
                'purchase_date': datetime.date(2026, 2, 1),
                'purchase_cost': 62000.00,
                'warranty_expiry': datetime.date(2031, 2, 1),
                'location': 'Server Rack - Floor 2',
                'notes': 'Powers office VoIP and Ubiquiti UniFi WiFi 6 APs'
            }
        ]
        for a_data in assets:
            EquipmentAsset.objects.get_or_create(asset_tag=a_data['asset_tag'], defaults=a_data)
        print(f"Equipment assets seeded. Total: {EquipmentAsset.objects.count()}")

    # 4. SEED STOCK ITEMS (CONSUMABLES & IT SUPPLIES)
    if StockItem.objects.count() < 4:
        stocks = [
            {
                'sku': 'STK-KEY-001',
                'name': 'Logitech MX Keys S Wireless Keyboard',
                'category': 'Keyboards & Mice',
                'quantity': 8,
                'min_stock_threshold': 3,
                'unit_cost': 9500.00,
                'location': 'Supply Cabinet - Shelf A1',
                'notes': 'Dual Bluetooth / Bolt receiver wireless keyboards'
            },
            {
                'sku': 'STK-MOS-002',
                'name': 'Logitech MX Master 3S Ergonomic Mouse',
                'category': 'Keyboards & Mice',
                'quantity': 7,
                'min_stock_threshold': 3,
                'unit_cost': 8200.00,
                'location': 'Supply Cabinet - Shelf A1',
                'notes': 'Silent click 8K DPI ergonomic mice'
            },
            {
                'sku': 'STK-CBL-003',
                'name': 'Anker 4K 60Hz USB-C to HDMI Braided Cable 2M',
                'category': 'Cables & Adapters',
                'quantity': 18,
                'min_stock_threshold': 5,
                'unit_cost': 1499.00,
                'location': 'Supply Cabinet - Shelf B2',
                'notes': 'For connecting laptops to external 4K monitors'
            },
            {
                'sku': 'STK-CHG-004',
                'name': 'Baseus 65W GaN Fast Charger 3-Port',
                'category': 'Cables & Adapters',
                'quantity': 3, # LOW STOCK ALERT!
                'min_stock_threshold': 5,
                'unit_cost': 2800.00,
                'location': 'Supply Cabinet - Shelf B2',
                'notes': 'Low stock warning! Need to reorder batch of 10'
            },
            {
                'sku': 'STK-SSD-005',
                'name': 'Samsung T7 Shield 1TB USB 3.2 Rugged Portable SSD',
                'category': 'Storage & Memory',
                'quantity': 6,
                'min_stock_threshold': 2,
                'unit_cost': 8999.00,
                'location': 'Secure Tech Vault',
                'notes': 'High-speed scratch disks for 4K video editing'
            },
            {
                'sku': 'STK-NOT-006',
                'name': 'JRAM Groups Executive Hardbound Notebook & Metal Pen',
                'category': 'Office Supplies & Stationery',
                'quantity': 45,
                'min_stock_threshold': 15,
                'unit_cost': 450.00,
                'location': 'Stationery Box - Cabinet C',
                'notes': 'Given to new joiners and VIP clients'
            },
            {
                'sku': 'STK-SWG-007',
                'name': 'JRAM Groups Team Tech Hoodie (Sizes L/XL)',
                'category': 'Branded Swag & Merch',
                'quantity': 2, # LOW STOCK ALERT!
                'min_stock_threshold': 6,
                'unit_cost': 1850.00,
                'location': 'Merchandise Wardrobe',
                'notes': 'Low stock alert! Need new vendor order'
            }
        ]
        for s_data in stocks:
            StockItem.objects.get_or_create(sku=s_data['sku'], defaults=s_data)
        print(f"Stock items seeded. Total: {StockItem.objects.count()}")

    print("Seeding completed successfully!")

if __name__ == '__main__':
    seed()
