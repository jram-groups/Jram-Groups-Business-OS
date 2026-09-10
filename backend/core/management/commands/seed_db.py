import os
import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from django.core.management.base import BaseCommand
from core.models import User, UserRole
from clients.models import Client, ClientStatus
from projects.models import Project, Task, ProjectPriority, ProjectStatus, TaskStatus
from employees.models import EmployeeProfile
from finance.models import Quotation, Invoice, Payment, QuotationStatus, InvoicePaymentStatus
from marketing.models import SocialMediaClient
from communications.models import WhatsAppLog, EmailLog
from notifications.models import Notification
from audit.models import ActivityLog

def generate_avatar(initials, bg_color, text_color, relative_path):
    full_path = settings.MEDIA_ROOT / relative_path
    os.makedirs(full_path.parent, exist_ok=True)
    
    size = (256, 256)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Circular background
    draw.ellipse((10, 10, 246, 246), fill=bg_color)
    # Inner border
    draw.ellipse((10, 10, 246, 246), outline=(255, 255, 255, 160), width=4)
    
    # Draw initials
    try:
        font = ImageFont.truetype("arial.ttf", 90)
    except Exception:
        font = ImageFont.load_default()
        
    bbox = draw.textbbox((0, 0), initials, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    draw.text(((256 - text_w) / 2, (256 - text_h) / 2 - 8), initials, fill=text_color, font=font)
    
    img.save(full_path, "PNG")
    return relative_path

class Command(BaseCommand):
    help = 'Seeds database with comprehensive, rich enterprise data for JRAM Groups Business OS into db.sqlite3'

    def handle(self, *args, **options):
        self.stdout.write("Seeding JRAM Groups Business OS database into db.sqlite3...")

        # 0. Clean old records
        Notification.objects.all().delete()
        ActivityLog.objects.all().delete()
        WhatsAppLog.objects.all().delete()
        EmailLog.objects.all().delete()
        Payment.objects.all().delete()
        Invoice.objects.all().delete()
        Quotation.objects.all().delete()
        Task.objects.all().delete()
        Project.objects.all().delete()
        SocialMediaClient.objects.all().delete()
        Client.objects.all().delete()
        EmployeeProfile.objects.all().delete()
        User.objects.all().delete()

        # Generate avatar images
        p_arun = generate_avatar("AK", (245, 158, 11), (15, 23, 42), "profiles/arun.png")
        p_priya = generate_avatar("PS", (147, 51, 234), (255, 255, 255), "profiles/priya.png")
        p_rahul = generate_avatar("RR", (37, 99, 235), (255, 255, 255), "profiles/rahul.png")
        p_divya = generate_avatar("DM", (16, 185, 129), (255, 255, 255), "profiles/divya.png")
        p_rohan = generate_avatar("RD", (30, 41, 59), (251, 191, 36), "profiles/rohan.png")
        p_kavya = generate_avatar("KN", (13, 148, 136), (255, 255, 255), "profiles/kavya.png")

        # 1. Users (Ensuring 1 Founder)
        founder = User.objects.create_user(
            username='arun_founder',
            email='arun.kumar@jramgroups.com',
            password='password123',
            first_name='Arun',
            last_name='Kumar',
            role=UserRole.FOUNDER,
            phone='+91 98765 43210',
            avatar_text='AK',
            profile_image=p_arun,
            department='Executive Office',
            designation='Founder & Group Director',
            bio='Visionary entrepreneur and Founder of JRAM Groups. Driving digital business modernization, enterprise growth, and multi-tenant OS operations.'
        )

        ceo = User.objects.create_user(
            username='priya_ceo',
            email='priya.sharma@jramgroups.com',
            password='password123',
            first_name='Priya',
            last_name='Sharma',
            role=UserRole.CEO,
            phone='+91 91234 56789',
            avatar_text='PS',
            profile_image=p_priya,
            department='Executive Office',
            designation='Chief Executive Officer',
            bio='Executive leader focused on corporate scaling, client acquisitions, strategic partnerships, and financial governance.'
        )

        manager = User.objects.create_user(
            username='rahul_manager',
            email='rahul.raj@jramgroups.com',
            password='password123',
            first_name='Rahul',
            last_name='Raj',
            role=UserRole.MANAGER,
            phone='+91 80011 22334',
            avatar_text='RR',
            profile_image=p_rahul,
            department='Operations',
            designation='General Manager',
            bio='Operations specialist managing multi-disciplinary client delivery, Kanban project pipelines, and cross-functional teams.'
        )

        team_head = User.objects.create_user(
            username='divya_head',
            email='divya.menon@jramgroups.com',
            password='password123',
            first_name='Divya',
            last_name='Menon',
            role=UserRole.TEAM_HEAD,
            phone='+91 77890 11234',
            avatar_text='DM',
            profile_image=p_divya,
            department='Engineering & Tech',
            designation='Tech Lead',
            bio='Technical architect specializing in high-throughput Django REST backends, secure React architecture, and cloud automation.'
        )

        emp = User.objects.create_user(
            username='rohan_dev',
            email='rohan.das@jramgroups.com',
            password='password123',
            first_name='Rohan',
            last_name='Das',
            role=UserRole.EMPLOYEE,
            phone='+91 99001 88776',
            avatar_text='RD',
            profile_image=p_rohan,
            department='Engineering & Tech',
            designation='Senior FullStack Developer',
            bio='Senior developer building responsive interfaces, data visualization dashboards, and resilient REST microservices.'
        )

        intern = User.objects.create_user(
            username='kavya_intern',
            email='kavya.nair@jramgroups.com',
            password='password123',
            first_name='Kavya',
            last_name='Nair',
            role=UserRole.TRAINEE,
            phone='+91 88123 45678',
            avatar_text='KN',
            profile_image=p_kavya,
            department='Digital Marketing',
            designation='Marketing Associate Intern',
            bio='Growth marketer driving viral video reels, creative brand assets, and multi-channel campaign analytics.'
        )

        # 2. Employee Profiles for ALL users with encrypted salary
        ep_founder = EmployeeProfile.objects.create(
            user=founder,
            employee_id='JRAM-EMP-000',
            dob=datetime.date(1985, 4, 12),
            emergency_contact='+91 98765 00000',
            joining_date=datetime.date(2021, 1, 1),
            skills=['Strategic Leadership', 'Venture Growth', 'Executive Management'],
            performance_score=99,
            leaves_taken=0
        )
        ep_founder.salary = "280000"

        ep_ceo = EmployeeProfile.objects.create(
            user=ceo,
            employee_id='JRAM-EMP-001',
            dob=datetime.date(1989, 9, 18),
            emergency_contact='+91 91234 00000',
            joining_date=datetime.date(2021, 6, 15),
            skills=['Executive Management', 'Strategic Partnerships', 'Revenue Operations'],
            performance_score=97,
            leaves_taken=3
        )
        ep_ceo.salary = "195000"

        ep_mgr = EmployeeProfile.objects.create(
            user=manager,
            employee_id='JRAM-EMP-002',
            dob=datetime.date(1991, 11, 5),
            emergency_contact='+91 80011 00000',
            joining_date=datetime.date(2022, 2, 1),
            skills=['Client Relations', 'Agile Operations', 'Resource Allocation'],
            performance_score=94,
            leaves_taken=5
        )
        ep_mgr.salary = "135000"

        ep_head = EmployeeProfile.objects.create(
            user=team_head,
            employee_id='JRAM-EMP-003',
            dob=datetime.date(1993, 8, 22),
            emergency_contact='+91 97979 34343',
            joining_date=datetime.date(2022, 6, 1),
            skills=['Architecture', 'System Design', 'Django REST', 'React', 'Docker'],
            performance_score=98,
            leaves_taken=4
        )
        ep_head.salary = "145000"

        ep_emp = EmployeeProfile.objects.create(
            user=emp,
            employee_id='JRAM-EMP-004',
            dob=datetime.date(1996, 5, 14),
            emergency_contact='+91 98989 12121',
            joining_date=datetime.date(2023, 3, 15),
            skills=['React 19', 'Django', 'TailwindCSS', 'PostgreSQL', 'Python'],
            performance_score=96,
            leaves_taken=2
        )
        ep_emp.salary = "98000"

        ep_intern = EmployeeProfile.objects.create(
            user=intern,
            employee_id='JRAM-EMP-005',
            dob=datetime.date(2002, 3, 20),
            emergency_contact='+91 88123 00000',
            joining_date=datetime.date(2024, 1, 10),
            skills=['Social Media Marketing', 'Canva', 'Video Production', 'Copywriting'],
            performance_score=92,
            leaves_taken=1
        )
        ep_intern.salary = "35000"

        # 3. Clients (8 Comprehensive Clients)
        c1 = Client.objects.create(
            name='Apex Corporation',
            company='Apex Corp Pvt Ltd',
            email='contact@apexcorp.com',
            phone='+91 98765 10001',
            whatsapp='+919876510001',
            address='123 Tech Park, BKC, Mumbai',
            business_type='Enterprise SaaS',
            services_taken=['ERP Integration', 'Branding', 'Digital Marketing'],
            client_status=ClientStatus.ACTIVE,
            social_media_accounts={'instagram': '@apexcorp_official', 'facebook': 'fb.com/apexcorp'},
            total_revenue=1450000.0
        )
        c1.assigned_employees.add(team_head, emp)

        c2 = Client.objects.create(
            name='NovaTech Solutions',
            company='NovaTech Innovations',
            email='info@novatech.io',
            phone='+91 91234 20002',
            whatsapp='+919123420002',
            address='456 Innovation Hub, Electronic City, Bangalore',
            business_type='SME Tech',
            services_taken=['Web App Development', 'Social Media Suite'],
            client_status=ClientStatus.ACTIVE,
            social_media_accounts={'instagram': '@novatech_io'},
            total_revenue=580000.0
        )
        c2.assigned_employees.add(emp, intern)

        c3 = Client.objects.create(
            name='Green Earth Organics',
            company='Green Earth Eco Products Ltd',
            email='hello@greenearth.com',
            phone='+91 80011 30003',
            whatsapp='+918001130003',
            address='789 Eco Street, T-Nagar, Chennai',
            business_type='Retail & Eco Products',
            services_taken=['E-Commerce Store', 'Branding', 'Influencer Marketing'],
            client_status=ClientStatus.ACTIVE,
            social_media_accounts={'instagram': '@greenearth_organic'},
            total_revenue=420000.0
        )
        c3.assigned_employees.add(manager, intern)

        c4 = Client.objects.create(
            name='Zenith Logistics Global',
            company='Zenith Express Freight Ltd',
            email='dispatch@zenithlogistics.com',
            phone='+91 99887 40004',
            whatsapp='+919988740004',
            address='Sector 62, Cyber City, Gurugram',
            business_type='Logistics & Supply Chain',
            services_taken=['Fleet Tracking OS', 'API Integration', 'Cloud Hosting'],
            client_status=ClientStatus.ACTIVE,
            social_media_accounts={'linkedin': 'linkedin.com/company/zenith-logistics'},
            total_revenue=980000.0
        )
        c4.assigned_employees.add(team_head, emp)

        c5 = Client.objects.create(
            name='Skyline Realty Ventures',
            company='Skyline Urban Developers',
            email='sales@skylinerealty.in',
            phone='+91 98450 50005',
            whatsapp='+919845050005',
            address='Jubilee Hills, Road No. 36, Hyderabad',
            business_type='Real Estate & Construction',
            services_taken=['3D Virtual Showcase', 'CRM Setup', 'Lead Funnel Ads'],
            client_status=ClientStatus.ACTIVE,
            social_media_accounts={'instagram': '@skylinerealty_luxury'},
            total_revenue=750000.0
        )
        c5.assigned_employees.add(manager, emp)

        c6 = Client.objects.create(
            name='Quantum Health Diagnostics',
            company='Quantum Life Sciences Pvt Ltd',
            email='care@quantumhealth.org',
            phone='+91 97112 60006',
            whatsapp='+919711260006',
            address='Park Street Commercial Center, Kolkata',
            business_type='Healthcare & Telemetry',
            services_taken=['Patient Telemetry Portal', 'HIPAA Security Compliance'],
            client_status=ClientStatus.PROSPECT,
            total_revenue=850000.0
        )
        c6.assigned_employees.add(team_head)

        c7 = Client.objects.create(
            name='Royal Heritage Jewels',
            company='Royal Heritage Crafts Ltd',
            email='vip@royaljewels.in',
            phone='+91 94331 70007',
            whatsapp='+919433170007',
            address='M.I. Road, Pink City, Jaipur',
            business_type='Luxury Jewelry & Craft',
            services_taken=['Luxury E-Commerce', 'Brand Catalog', 'Social Ads'],
            client_status=ClientStatus.PROSPECT,
            total_revenue=350000.0
        )

        c8 = Client.objects.create(
            name='Pulse Media Network',
            company='Pulse Digital Broadcasting Ltd',
            email='contact@pulsemedia.tv',
            phone='+91 93220 80008',
            whatsapp='+919322080008',
            address='Andheri West, Media Hub, Mumbai',
            business_type='Digital Media & Entertainment',
            services_taken=['Content Studio Suite', 'Digital Marketing Retainer'],
            client_status=ClientStatus.ACTIVE,
            social_media_accounts={'instagram': '@pulsemedia_live', 'youtube': 'youtube.com/@pulsemedia'},
            total_revenue=620000.0
        )
        c8.assigned_employees.add(manager, intern)

        # 4. Projects (8 Realistic Projects)
        p1 = Project.objects.create(
            name='Apex Business OS Modernization',
            client=c1,
            description='Complete enterprise ERP and CRM integration with Django REST framework backend',
            service_type='FullStack Web Application',
            start_date=datetime.date(2026, 5, 1),
            expected_completion=datetime.date(2026, 9, 30),
            duration_days=150,
            estimated_hours=450.0,
            actual_working_hours=320.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.URGENT,
            workflow_stage='Backend API & Frontend Assembly',
            progress_pct=72,
            budget=950000.0,
            spent=520000.0
        )
        p1.assigned_employees.add(founder, team_head, emp)

        p2 = Project.objects.create(
            name='NovaTech SaaS Portal & Marketing Suite',
            client=c2,
            description='Digital marketing campaign setup, social media asset creation, and client dashboard',
            service_type='Digital Marketing & Web Portal',
            start_date=datetime.date(2026, 6, 15),
            expected_completion=datetime.date(2026, 10, 15),
            duration_days=120,
            estimated_hours=250.0,
            actual_working_hours=140.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.HIGH,
            workflow_stage='Content Production',
            progress_pct=55,
            budget=580000.0,
            spent=240000.0
        )
        p2.assigned_employees.add(manager, emp, intern)

        p3 = Project.objects.create(
            name='Zenith Real-Time Fleet Tracking OS',
            client=c4,
            description='GPS telemetry integration, driver dispatch Kanban, and automated shipment invoicing',
            service_type='Cloud IoT & Mobile OS',
            start_date=datetime.date(2026, 4, 10),
            expected_completion=datetime.date(2026, 9, 15),
            duration_days=160,
            estimated_hours=480.0,
            actual_working_hours=410.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.URGENT,
            workflow_stage='Live GPS Telemetry Testing',
            progress_pct=85,
            budget=980000.0,
            spent=720000.0
        )
        p3.assigned_employees.add(team_head, emp)

        p4 = Project.objects.create(
            name='Skyline Realty Virtual 3D Showcase',
            client=c5,
            description='Interactive architectural walkthrough, buyer CRM leads pipeline, and floorplan viewer',
            service_type='Interactive Web3D Experience',
            start_date=datetime.date(2026, 7, 1),
            expected_completion=datetime.date(2026, 11, 30),
            duration_days=150,
            estimated_hours=320.0,
            actual_working_hours=90.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.MEDIUM,
            workflow_stage='3D Asset Modeling',
            progress_pct=30,
            budget=750000.0,
            spent=190000.0
        )
        p4.assigned_employees.add(manager, emp)

        p5 = Project.objects.create(
            name='Green Earth Organics D2C Storefront',
            client=c3,
            description='High-conversion mobile-first e-commerce, automated WhatsApp checkout, and loyalty points',
            service_type='E-Commerce Storefront',
            start_date=datetime.date(2026, 3, 1),
            expected_completion=datetime.date(2026, 8, 31),
            duration_days=180,
            estimated_hours=360.0,
            actual_working_hours=345.0,
            status=ProjectStatus.COMPLETED,
            priority=ProjectPriority.HIGH,
            workflow_stage='Delivered & Live Maintenance',
            progress_pct=100,
            budget=420000.0,
            spent=390000.0
        )
        p5.assigned_employees.add(manager, emp, intern)

        p6 = Project.objects.create(
            name='Quantum Health Telemetry Engine',
            client=c6,
            description='Secure patient vital statistics monitoring and HIPAA compliant doctor consultation logs',
            service_type='HealthTech Cloud Platform',
            start_date=datetime.date(2026, 7, 15),
            expected_completion=datetime.date(2026, 12, 20),
            duration_days=155,
            estimated_hours=420.0,
            actual_working_hours=130.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.URGENT,
            workflow_stage='Security Encryption Audit',
            progress_pct=40,
            budget=850000.0,
            spent=280000.0
        )
        p6.assigned_employees.add(team_head, emp)

        p7 = Project.objects.create(
            name='Pulse Media Viral Content Production',
            client=c8,
            description='High-definition reels creation, studio filming, influencer collaborations, and audience growth',
            service_type='Digital Marketing Retainer',
            start_date=datetime.date(2026, 6, 1),
            expected_completion=datetime.date(2026, 12, 31),
            duration_days=210,
            estimated_hours=280.0,
            actual_working_hours=185.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.MEDIUM,
            workflow_stage='Reel Broadcast & Ads Scaling',
            progress_pct=65,
            budget=620000.0,
            spent=340000.0
        )
        p7.assigned_employees.add(manager, intern)

        p8 = Project.objects.create(
            name='JRAM Internal Cloud Infrastructure & AI Pipeline',
            client=c1,
            description='Automated database backups, AI copilot pipeline, and performance load balancer',
            service_type='Internal Core R&D',
            start_date=datetime.date(2026, 5, 20),
            expected_completion=datetime.date(2026, 10, 30),
            duration_days=160,
            estimated_hours=300.0,
            actual_working_hours=260.0,
            status=ProjectStatus.IN_PROGRESS,
            priority=ProjectPriority.URGENT,
            workflow_stage='Load Testing & Benchmarking',
            progress_pct=88,
            budget=500000.0,
            spent=380000.0
        )
        p8.assigned_employees.add(founder, team_head)

        # 5. Tasks (16+ Tasks Across Projects)
        tasks_data = [
            (p1, 'Implement Django REST User Profile with Image Storage', 'Add profile_image field, avatar generation, and persistence into SQLite', emp, ProjectPriority.URGENT, TaskStatus.COMPLETED, datetime.date(2026, 9, 4), 16.0, 16.0),
            (p1, 'Configure RBAC RouteGuard and Security Matrix', 'Enforce single founder constraint and permission checks across 6 roles', team_head, ProjectPriority.URGENT, TaskStatus.COMPLETED, datetime.date(2026, 8, 20), 24.0, 24.0),
            (p1, 'Connect Real-Time Financial Ledger with Recharts', 'Render cashflow curves, target vs actual bar charts, and payment logs', emp, ProjectPriority.HIGH, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 10), 32.0, 22.0),
            (p2, 'Design Instagram Reels & Motion Graphic Templates', 'Produce 15 viral tech reel templates in After Effects and Canva', intern, ProjectPriority.HIGH, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 12), 25.0, 18.0),
            (p2, 'Build NovaTech Client KPI Dashboard', 'React 19 dashboard showing live ad spend and impressions', emp, ProjectPriority.MEDIUM, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 18), 30.0, 14.0),
            (p3, 'Integrate Mapbox Real-Time Vehicle Tracking', 'WebSocket integration for live truck coordinates on interactive map', team_head, ProjectPriority.URGENT, TaskStatus.COMPLETED, datetime.date(2026, 8, 28), 40.0, 40.0),
            (p3, 'Automated Driver Waybill Generation PDF', 'Backend PDF rendering for dispatch invoices and cargo manifests', emp, ProjectPriority.HIGH, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 8), 20.0, 15.0),
            (p4, 'Three.js 3D Virtual Villa Modeling', 'Optimize polygon meshes and baked lighting for mobile browser 60fps', emp, ProjectPriority.MEDIUM, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 25), 45.0, 18.0),
            (p4, 'Lead Capture Modal & WhatsApp Sales Hook', 'Instant CRM webhook notification when high-intent buyer views property', manager, ProjectPriority.MEDIUM, TaskStatus.COMPLETED, datetime.date(2026, 8, 15), 12.0, 12.0),
            (p5, 'Deploy Next-Gen Payment Gateway for Green Earth', 'UPI Deep-link and Razorpay webhook integration with receipt generator', emp, ProjectPriority.HIGH, TaskStatus.COMPLETED, datetime.date(2026, 8, 10), 28.0, 28.0),
            (p5, 'Final User Acceptance & Performance Signoff', 'Lighthouse score 98+ audit across all catalog pages', manager, ProjectPriority.HIGH, TaskStatus.COMPLETED, datetime.date(2026, 8, 25), 10.0, 10.0),
            (p6, 'Implement AES-256 Patient Data Encryption', 'Encrypted database columns for health telemetry readings', team_head, ProjectPriority.URGENT, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 15), 35.0, 20.0),
            (p7, 'Film Episode 1-4 for Pulse Media Showcase', 'Studio 4K shooting and multi-cam podcast editing', intern, ProjectPriority.MEDIUM, TaskStatus.IN_PROGRESS, datetime.date(2026, 9, 20), 40.0, 25.0),
            (p8, 'Setup Automated SQLite WAL Mode & Daily Snapshot', 'High performance WAL journal mode and auto sync to cloud vault', team_head, ProjectPriority.URGENT, TaskStatus.COMPLETED, datetime.date(2026, 8, 30), 16.0, 16.0),
            (p1, 'Audit Log Ingestion & Session Tracker', 'Real-time logging of employee mutations and role elevation', emp, ProjectPriority.MEDIUM, TaskStatus.COMPLETED, datetime.date(2026, 9, 1), 14.0, 14.0),
            (p2, 'Meta Ads Manager Campaign Setup & Pixel Sync', 'Configure conversion API and custom audience lookalikes', intern, ProjectPriority.HIGH, TaskStatus.COMPLETED, datetime.date(2026, 8, 22), 15.0, 15.0),
        ]

        for t in tasks_data:
            Task.objects.create(
                project=t[0],
                title=t[1],
                description=t[2],
                assigned_to=t[3],
                priority=t[4],
                status=t[5],
                due_date=t[6],
                estimated_hours=t[7],
                logged_hours=t[8]
            )

        # 6. Quotations (7 Itemized Quotations)
        q1 = Quotation.objects.create(
            reference='QT-2026-001',
            client=c1,
            project=p1,
            items=[
                {'description': 'Django REST Backend Architecture', 'qty': 1, 'price': 450000, 'amount': 450000},
                {'description': 'React 19 Frontend Dashboard & Analytics', 'qty': 1, 'price': 350000, 'amount': 350000},
                {'description': 'WhatsApp & Email Automated Alerts', 'qty': 1, 'price': 150000, 'amount': 150000}
            ],
            subtotal=950000.0,
            discount=50000.0,
            tax=162000.0,
            total_amount=1062000.0,
            valid_until=datetime.date(2026, 9, 30),
            terms='50% advance milestone, 50% upon deployment',
            status=QuotationStatus.ACCEPTED
        )

        q2 = Quotation.objects.create(
            reference='QT-2026-002',
            client=c2,
            project=p2,
            items=[
                {'description': 'Digital Marketing Retainer (6 Months)', 'qty': 6, 'price': 65000, 'amount': 390000},
                {'description': 'React KPI Dashboard & Analytics', 'qty': 1, 'price': 190000, 'amount': 190000}
            ],
            subtotal=580000.0,
            discount=20000.0,
            tax=100800.0,
            total_amount=660800.0,
            valid_until=datetime.date(2026, 10, 15),
            terms='Monthly billing on 1st of every month',
            status=QuotationStatus.ACCEPTED
        )

        q3 = Quotation.objects.create(
            reference='QT-2026-003',
            client=c4,
            project=p3,
            items=[
                {'description': 'Zenith Telemetry GPS Server & Mobile App', 'qty': 1, 'price': 700000, 'amount': 700000},
                {'description': 'Fleet Waybill & ERP Integration', 'qty': 1, 'price': 280000, 'amount': 280000}
            ],
            subtotal=980000.0,
            discount=30000.0,
            tax=171000.0,
            total_amount=1121000.0,
            valid_until=datetime.date(2026, 9, 15),
            terms='30% advance, 40% beta test, 30% handover',
            status=QuotationStatus.ACCEPTED
        )

        q4 = Quotation.objects.create(
            reference='QT-2026-004',
            client=c5,
            project=p4,
            items=[
                {'description': '3D WebGL Virtual Property Showcase', 'qty': 1, 'price': 550000, 'amount': 550000},
                {'description': 'Lead Generation & Ads Media Buying', 'qty': 1, 'price': 200000, 'amount': 200000}
            ],
            subtotal=750000.0,
            discount=0.0,
            tax=135000.0,
            total_amount=885000.0,
            valid_until=datetime.date(2026, 11, 30),
            terms='40% advance, 60% completion',
            status=QuotationStatus.SENT
        )

        q5 = Quotation.objects.create(
            reference='QT-2026-005',
            client=c3,
            project=p5,
            items=[
                {'description': 'E-Commerce Storefront & WhatsApp Checkout', 'qty': 1, 'price': 420000, 'amount': 420000}
            ],
            subtotal=420000.0,
            discount=20000.0,
            tax=72000.0,
            total_amount=472000.0,
            valid_until=datetime.date(2026, 8, 31),
            terms='Full payment on deployment',
            status=QuotationStatus.ACCEPTED
        )

        q6 = Quotation.objects.create(
            reference='QT-2026-006',
            client=c6,
            project=p6,
            items=[
                {'description': 'Quantum Telemetry Core & HIPAA Vault', 'qty': 1, 'price': 850000, 'amount': 850000}
            ],
            subtotal=850000.0,
            discount=50000.0,
            tax=144000.0,
            total_amount=944000.0,
            valid_until=datetime.date(2026, 12, 1),
            terms='Staged corporate release schedule',
            status=QuotationStatus.DRAFT
        )

        q7 = Quotation.objects.create(
            reference='QT-2026-007',
            client=c8,
            project=p7,
            items=[
                {'description': 'Annual Video & Social Content Production', 'qty': 12, 'price': 50000, 'amount': 600000}
            ],
            subtotal=600000.0,
            discount=0.0,
            tax=108000.0,
            total_amount=708000.0,
            valid_until=datetime.date(2026, 12, 31),
            terms='Monthly billing cycle',
            status=QuotationStatus.ACCEPTED
        )

        # 7. Invoices (8 Invoices with item details)
        inv1 = Invoice.objects.create(
            reference='INV-2026-001',
            client=c1,
            project=p1,
            invoice_date=datetime.date(2026, 6, 1),
            due_date=datetime.date(2026, 6, 30),
            paid_date=datetime.date(2026, 6, 25),
            items=[{'description': 'Milestone 1 Advance Payment - ERP Core', 'qty': 1, 'price': 531000, 'amount': 531000}],
            subtotal=531000.0,
            discount=0.0,
            tax=0.0,
            total_amount=531000.0,
            payment_status=InvoicePaymentStatus.PAID,
            notes='Paid via NEFT Direct Transfer by Apex Corp'
        )

        inv2 = Invoice.objects.create(
            reference='INV-2026-002',
            client=c2,
            project=p2,
            invoice_date=datetime.date(2026, 7, 1),
            due_date=datetime.date(2026, 7, 20),
            paid_date=datetime.date(2026, 7, 18),
            items=[{'description': 'Digital Marketing Retainer - July 2026', 'qty': 1, 'price': 76700, 'amount': 76700}],
            subtotal=76700.0,
            discount=0.0,
            tax=0.0,
            total_amount=76700.0,
            payment_status=InvoicePaymentStatus.PAID,
            notes='Cleared through Corporate UPI'
        )

        inv3 = Invoice.objects.create(
            reference='INV-2026-003',
            client=c3,
            project=p5,
            invoice_date=datetime.date(2026, 7, 15),
            due_date=datetime.date(2026, 8, 15),
            paid_date=datetime.date(2026, 8, 12),
            items=[{'description': 'D2C E-Commerce Storefront Launch Handover', 'qty': 1, 'price': 472000, 'amount': 472000}],
            subtotal=472000.0,
            discount=0.0,
            tax=0.0,
            total_amount=472000.0,
            payment_status=InvoicePaymentStatus.PAID,
            notes='Direct RTGS received'
        )

        inv4 = Invoice.objects.create(
            reference='INV-2026-004',
            client=c4,
            project=p3,
            invoice_date=datetime.date(2026, 7, 25),
            due_date=datetime.date(2026, 8, 25),
            paid_date=datetime.date(2026, 8, 20),
            items=[{'description': 'Zenith Telemetry Advance Milestone', 'qty': 1, 'price': 450000, 'amount': 450000}],
            subtotal=450000.0,
            discount=0.0,
            tax=0.0,
            total_amount=450000.0,
            payment_status=InvoicePaymentStatus.PAID,
            notes='Settled via Bank Wire Transfer'
        )

        inv5 = Invoice.objects.create(
            reference='INV-2026-005',
            client=c1,
            project=p1,
            invoice_date=datetime.date(2026, 8, 1),
            due_date=datetime.date(2026, 8, 31),
            paid_date=datetime.date(2026, 8, 28),
            items=[{'description': 'Milestone 2 - Frontend Assembly & CRM', 'qty': 1, 'price': 531000, 'amount': 531000}],
            subtotal=531000.0,
            discount=0.0,
            tax=0.0,
            total_amount=531000.0,
            payment_status=InvoicePaymentStatus.PAID,
            notes='Paid via NEFT Transfer'
        )

        inv6 = Invoice.objects.create(
            reference='INV-2026-006',
            client=c8,
            project=p7,
            invoice_date=datetime.date(2026, 8, 1),
            due_date=datetime.date(2026, 8, 20),
            paid_date=datetime.date(2026, 8, 19),
            items=[{'description': 'August Media Production Retainer', 'qty': 1, 'price': 59000, 'amount': 59000}],
            subtotal=59000.0,
            discount=0.0,
            tax=0.0,
            total_amount=59000.0,
            payment_status=InvoicePaymentStatus.PAID,
            notes='Instant UPI settlement'
        )

        inv7 = Invoice.objects.create(
            reference='INV-2026-007',
            client=c5,
            project=p4,
            invoice_date=datetime.date(2026, 8, 10),
            due_date=datetime.date(2026, 9, 10),
            paid_date=None,
            items=[{'description': 'Virtual 3D Asset Sprint 1 Milestone', 'qty': 1, 'price': 354000, 'amount': 354000}],
            subtotal=354000.0,
            discount=0.0,
            tax=0.0,
            total_amount=354000.0,
            payment_status=InvoicePaymentStatus.PENDING,
            notes='Invoice dispatched to Skyline Accounts Dept'
        )

        inv8 = Invoice.objects.create(
            reference='INV-2026-008',
            client=c4,
            project=p3,
            invoice_date=datetime.date(2026, 8, 20),
            due_date=datetime.date(2026, 9, 20),
            paid_date=None,
            items=[{'description': 'Zenith Telemetry Milestone 2', 'qty': 1, 'price': 390000, 'amount': 390000}],
            subtotal=390000.0,
            discount=0.0,
            tax=0.0,
            total_amount=390000.0,
            payment_status=InvoicePaymentStatus.PENDING,
            notes='Awaiting final GPS acceptance run'
        )

        # 8. Payments (Verified Payments in Ledger - Powers Financial Page)
        payments_data = [
            (inv1, c1, 531000.0, 'NEFT Bank Transfer', datetime.date(2026, 6, 25), 'PAY-2026-001', 'Milestone 1 for Apex Business OS'),
            (inv2, c2, 76700.0, 'UPI Instant', datetime.date(2026, 7, 18), 'PAY-2026-002', 'Monthly Retainer for NovaTech'),
            (inv3, c3, 472000.0, 'RTGS Direct Transfer', datetime.date(2026, 8, 12), 'PAY-2026-003', 'Final Handover for Green Earth Storefront'),
            (inv4, c4, 450000.0, 'NEFT Bank Transfer', datetime.date(2026, 8, 20), 'PAY-2026-004', 'Milestone 1 for Zenith Real-Time Fleet OS'),
            (inv5, c1, 531000.0, 'NEFT Bank Transfer', datetime.date(2026, 8, 28), 'PAY-2026-005', 'Milestone 2 for Apex Business OS'),
            (inv6, c8, 59000.0, 'Corporate Credit Card', datetime.date(2026, 8, 19), 'PAY-2026-006', 'August Media Production Retainer Pulse Media'),
        ]

        for p in payments_data:
            Payment.objects.create(
                invoice=p[0],
                client=p[1],
                amount=p[2],
                payment_method=p[3],
                payment_date=p[4],
                reference=p[5],
                notes=p[6]
            )

        # 9. Social Media Clients (Digital Marketing Suite)
        SocialMediaClient.objects.create(
            client=c2,
            instagram_handle='@novatech_official',
            facebook_page='facebook.com/novatechinnovations',
            package_name='Gold Monthly Marketing Suite',
            start_date=datetime.date(2026, 6, 1),
            end_date=datetime.date(2026, 12, 31),
            monthly_payment=65000.0,
            payment_status='Paid',
            videos_planned=24,
            videos_completed=19,
            posters_planned=36,
            posters_completed=32,
            reels_count=22,
            posts_count=40,
            stories_count=85,
            campaigns_count=5,
            content_status='On Track'
        ).assigned_team.add(manager, intern)

        SocialMediaClient.objects.create(
            client=c3,
            instagram_handle='@greenearth_organics',
            facebook_page='facebook.com/greenearthorganicproducts',
            package_name='Eco D2C Growth Retainer',
            start_date=datetime.date(2026, 4, 1),
            end_date=datetime.date(2026, 10, 31),
            monthly_payment=45000.0,
            payment_status='Paid',
            videos_planned=16,
            videos_completed=15,
            posters_planned=28,
            posters_completed=28,
            reels_count=18,
            posts_count=32,
            stories_count=60,
            campaigns_count=3,
            content_status='Delivered'
        ).assigned_team.add(manager, intern)

        SocialMediaClient.objects.create(
            client=c5,
            instagram_handle='@skylinerealty_luxury',
            facebook_page='facebook.com/skylinerealtyluxury',
            package_name='Platinum Luxury Real Estate Leads',
            start_date=datetime.date(2026, 7, 1),
            end_date=datetime.date(2026, 12, 31),
            monthly_payment=95000.0,
            payment_status='Pending',
            videos_planned=30,
            videos_completed=12,
            posters_planned=45,
            posters_completed=20,
            reels_count=15,
            posts_count=25,
            stories_count=50,
            campaigns_count=6,
            content_status='Active Campaign'
        ).assigned_team.add(manager, emp, intern)

        SocialMediaClient.objects.create(
            client=c8,
            instagram_handle='@pulsemedia_tv',
            facebook_page='facebook.com/pulsemedianetwork',
            package_name='Broadcast Studio Retainer',
            start_date=datetime.date(2026, 5, 1),
            end_date=datetime.date(2026, 11, 30),
            monthly_payment=59000.0,
            payment_status='Paid',
            videos_planned=20,
            videos_completed=18,
            posters_planned=30,
            posters_completed=25,
            reels_count=20,
            posts_count=30,
            stories_count=70,
            campaigns_count=4,
            content_status='On Track'
        ).assigned_team.add(manager, intern)

        # 10. WhatsApp and Email Logs
        WhatsAppLog.objects.create(
            recipient_name='Apex Corp Accounts',
            whatsapp_number='+919876510001',
            message_type='Invoice Dispatched',
            message_text='Hello Apex Corp! Your Invoice INV-2026-005 for ₹5,31,000 has been verified and dispatched.',
            status='Delivered',
            sent_by=founder
        )
        WhatsAppLog.objects.create(
            recipient_name='NovaTech Marketing Lead',
            whatsapp_number='+919123420002',
            message_type='Content Approval',
            message_text='Hi Team! 6 new Instagram Reels for August have been uploaded to your dashboard for preview.',
            status='Read',
            sent_by=intern
        )
        WhatsAppLog.objects.create(
            recipient_name='Skyline Realty Founder',
            whatsapp_number='+919845050005',
            message_type='Payment Reminder',
            message_text='Greetings! Reminder regarding Invoice INV-2026-007 for Virtual 3D Asset Milestone due on Sept 10.',
            status='Sent',
            sent_by=manager
        )

        EmailLog.objects.create(
            recipient_email='dispatch@zenithlogistics.com',
            recipient_name='Zenith Logistics Global',
            subject='Zenith Telemetry GPS Server Milestone 2 Completion',
            body='Dear Zenith Team, we have completed the WebSocket telemetry engine and load test reports.',
            attachments=['zenith_telemetry_report_v2.pdf'],
            status='Delivered',
            sent_by=team_head
        )
        EmailLog.objects.create(
            recipient_email='contact@apexcorp.com',
            recipient_name='Apex Corporation',
            subject='Payment Receipt Acknowledgement - PAY-2026-005',
            body='Thank you for your NEFT payment of ₹5,31,000 against Invoice INV-2026-005. The receipt is attached.',
            attachments=['receipt_PAY-2026-005.pdf'],
            status='Delivered',
            sent_by=ceo
        )

        # 11. Notifications
        notifs = [
            (founder, '🚨 URGENT Project Alert: Apex Business OS Modernization', 'Project Apex Business OS is on fast-track priority for milestone 3 delivery.', 'urgent_project', 'Project', str(p1.id)),
            (founder, '💰 Payment Ledger Verified: ₹5,31,000 Received', 'NEFT Bank Transfer settled from Apex Corporation into primary business account.', 'payment', 'Payment', 'PAY-2026-005'),
            (ceo, '📊 New Quotation Accepted: Zenith Fleet Tracking OS', 'Quotation QT-2026-003 for ₹11,21,000 has been signed and accepted.', 'quotation', 'Quotation', str(q3.id)),
            (manager, '📢 Skyline Realty Review Meeting Scheduled', 'Virtual 3D showcase demo scheduled for upcoming Monday with Skyline directors.', 'general', 'Project', str(p4.id)),
            (team_head, '🛡️ Security Encryption Milestone Complete', 'AES-256 field encryption implemented across all sensitive payroll fields.', 'security', 'Core', '1'),
            (emp, '⚡ New Task Assigned: Real-Time Financial Ledger Analytics', 'You have been assigned to task: Connect Real-Time Financial Ledger with Recharts.', 'assignment', 'Task', '1'),
            (intern, '🎬 4 New Reels Approved by NovaTech', 'NovaTech Innovations approved all 4 tech video reels for weekly scheduling.', 'marketing', 'Marketing', '1'),
        ]

        for n in notifs:
            Notification.objects.create(
                user=n[0],
                title=n[1],
                message=n[2],
                notification_type=n[3],
                related_entity_type=n[4],
                related_entity_id=n[5]
            )

        # 12. Activity Logs (Audit Trail)
        activity_data = [
            ('Arun Kumar', 'Founder', 'System Database Seed', 'Core System', 'Entire Business OS Stored into db.sqlite3', 'Populated all 10 modules: Clients, Projects, Tasks, Employees, Invoices, Quotations, Payments, Marketing, Logs, Profile Avatars.'),
            ('Arun Kumar', 'Founder', 'Profile Image Updated', 'User Profile', 'Profile Avatar Generated & Saved in SQLite', 'Added profile_image and bio for all 6 organizational accounts.'),
            ('Priya Sharma', 'CEO', 'Quotation Approved', 'Sales & Finance', 'Quotation QT-2026-003 Verified', 'Signed ₹11,21,000 corporate agreement for Zenith Logistics Global.'),
            ('Rahul Raj', 'Manager', 'Client Onboarding', 'Clients CRM', 'Skyline Realty Ventures Added', 'Created new enterprise client and assigned delivery leads.'),
            ('Divya Menon', 'Team Head', 'Security Audit', 'Engineering & Tech', 'Fernet Salary Encryption Verified', 'Audited 6 employee payroll records; encrypted in db.sqlite3.'),
            ('Rohan Das', 'Employee', 'Task Progress Logged', 'Tasks & Hours', 'Frontend Profile Component Assembled', 'Completed profile page implementation with photo upload.'),
            ('Kavya Nair', 'Trainee', 'Content Scheduled', 'Digital Marketing', 'NovaTech Reels Scheduled', 'Queued 6 Instagram video reels for automated release.'),
        ]

        for a in activity_data:
            ActivityLog.objects.create(
                user_name=a[0],
                user_role=a[1],
                action=a[2],
                module=a[3],
                record_title=a[4],
                details=a[5]
            )

        self.stdout.write(self.style.SUCCESS("Entire JRAM Groups Business OS dataset successfully stored into db.sqlite3 with profile images and cross-module relationships!"))
