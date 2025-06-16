import pandas as pd
import numpy as np
from datetime import datetime

# Create a comprehensive Excel workbook with multiple sheets for Zerodha business model
print("Creating Comprehensive Zerodha Business Model Excel Workbook...")

# Create an Excel writer object
with pd.ExcelWriter('Zerodha_Business_Model_Analysis.xlsx', engine='openpyxl') as writer:
    
    # Sheet 1: Executive Summary
    exec_summary = {
        'Key Metrics': [
            'Company Name',
            'Founded',
            'Headquarters', 
            'Business Model',
            'FY2024 Revenue',
            'FY2024 Profit',
            'Operating Margin',
            'Active Clients',
            'Market Share',
            'Valuation',
            'Funding Status',
            'Employees'
        ],
        'Values': [
            'Zerodha Broking Limited',
            '2010',
            'Bangalore, India',
            'Discount Brokerage',
            'Rs. 8,320 Crore',
            'Rs. 4,700 Crore',
            '56.5%',
            '79 Lakh',
            '15-18%',
            '$3.6 Billion',
            'Bootstrapped (No External Funding)',
            '1,200+'
        ],
        'Industry Comparison': [
            'Leading Discount Broker',
            'Post-2008 Financial Crisis Era',
            'Tier-1 City',
            'Discount vs Full-Service',
            'Market Leader',
            'Highest in Sector',
            'Industry Leading',
            'Top 3 in India',
            'Market Leader',
            'Unicorn Status',
            'Rare Bootstrapped Unicorn',
            'Lean Organization'
        ]
    }
    
    exec_df = pd.DataFrame(exec_summary)
    exec_df.to_excel(writer, sheet_name='Executive Summary', index=False)
    
    # Sheet 2: Financial Performance
    financial_df.to_excel(writer, sheet_name='Financial Performance', index=False)
    
    # Sheet 3: Revenue Streams
    revenue_df.to_excel(writer, sheet_name='Revenue Streams', index=False)
    
    # Sheet 4: Operating Expenses
    opex_df.to_excel(writer, sheet_name='Operating Expenses', index=False)
    
    # Sheet 5: Pricing Model
    pricing_df.to_excel(writer, sheet_name='Pricing Structure', index=False)
    
    # Sheet 6: CAPEX Analysis
    capex_df.to_excel(writer, sheet_name='CAPEX Analysis', index=False)
    
    # Sheet 7: Key Metrics & KPIs
    kpi_df.to_excel(writer, sheet_name='Key Metrics', index=False)
    
    # Sheet 8: Competitive Landscape
    competitive_df.to_excel(writer, sheet_name='Competitive Analysis', index=False)
    
    # Sheet 9: Business Model Canvas
    canvas_data = {
        'Component': [
            'Key Partners',
            'Key Activities',
            'Key Resources',
            'Value Propositions',
            'Customer Relationships',
            'Customer Segments',
            'Channels',
            'Cost Structure',
            'Revenue Streams'
        ],
        'Details': [
            'Stock Exchanges (NSE, BSE, MCX), Technology Partners, Regulatory Bodies (SEBI), Payment Gateways, Fund Houses',
            'Trading Platform Operations, Customer Support, Technology Development, Risk Management, Compliance',
            'Technology Infrastructure, Trading Licenses, Brand Reputation, Human Capital, Customer Base',
            'Zero Brokerage on Delivery, Low-cost Trading, User-friendly Platform, Educational Content, Transparency',
            'Self-service Platform, Community Building, Educational Content, Digital Support',
            'Retail Investors, Young Professionals, Tech-savvy Traders, First-time Investors, Active Traders',
            'Online Platform (Kite), Mobile App, Website, Educational Content (Varsity), Social Media',
            'Technology Infrastructure, Employee Costs, Regulatory Compliance, Exchange Fees, Office Operations',
            'Brokerage Fees, Account Maintenance, Interest on Funds, Exchange Rebates, Premium Services'
        ]
    }
    
    canvas_df = pd.DataFrame(canvas_data)
    canvas_df.to_excel(writer, sheet_name='Business Model Canvas', index=False)
    
    # Sheet 10: Future Projections (3-year forecast)
    projection_data = {
        'Financial Year': ['FY 2024-25', 'FY 2025-26', 'FY 2026-27'],
        'Revenue (Rs. Crore)': [7500, 8200, 9000],  # Considering regulatory impact
        'Revenue Growth (%)': [-9.9, 9.3, 9.8],
        'Profit (Rs. Crore)': [3800, 4500, 5200],
        'Profit Growth (%)': [-19.1, 18.4, 15.6],
        'Active Clients (Million)': [8.5, 9.2, 10.0],
        'Market Share (%)': [16.5, 17.2, 18.0],
        'Key Assumptions': [
            'SEBI regulations impact, Market volatility',
            'Recovery from regulatory impact, Market expansion',
            'Steady growth, New product launches'
        ]
    }
    
    projection_df = pd.DataFrame(projection_data)
    projection_df.to_excel(writer, sheet_name='Future Projections', index=False)
    
    # Sheet 11: Risk Analysis
    risk_data = {
        'Risk Category': [
            'Regulatory Risk',
            'Market Risk',
            'Competition Risk',
            'Technology Risk',
            'Operational Risk',
            'Reputational Risk'
        ],
        'Risk Description': [
            'SEBI regulatory changes affecting revenue streams',
            'Market volatility affecting trading volumes',
            'Increasing competition from new entrants',
            'Technology failures or cyber security threats',
            'Operational disruptions affecting service quality',
            'Brand reputation damage from service issues'
        ],
        'Impact Level': [
            'High',
            'Medium',
            'Medium',
            'High',
            'Medium',
            'Medium'
        ],
        'Probability': [
            'High',
            'Medium',
            'High',
            'Low',
            'Low',
            'Low'
        ],
        'Mitigation Strategies': [
            'Diversification, Regulatory compliance, Engagement with regulators',
            'Diversified revenue streams, Risk management systems',
            'Innovation, Customer loyalty programs, Service quality',
            'Robust IT infrastructure, Regular updates, Security measures',
            'Process optimization, Redundancy systems, Staff training',
            'Transparent communication, Quality service, Crisis management'
        ]
    }
    
    risk_df = pd.DataFrame(risk_data)
    risk_df.to_excel(writer, sheet_name='Risk Analysis', index=False)

print("✓ Comprehensive Excel workbook created: Zerodha_Business_Model_Analysis.xlsx")
print("✓ Contains 11 sheets with detailed business model analysis")

# Create a summary for final display
print("\n" + "="*60)
print("ZERODHA BUSINESS MODEL - KEY HIGHLIGHTS")
print("="*60)
print("📊 Revenue (FY2024): Rs. 8,320 Crore")
print("💰 Profit (FY2024): Rs. 4,700 Crore") 
print("📈 Operating Margin: 56.5%")
print("👥 Active Clients: 79 Lakh")
print("🏆 Market Share: 15-18%")
print("💡 Business Model: Discount Brokerage")
print("🚀 Valuation: $3.6 Billion")
print("💪 Funding: Bootstrapped (No External Investment)")
print("="*60)

# List all files created
print("\nFiles created:")
print("1. Zerodha_Business_Model_Analysis.xlsx (Comprehensive workbook)")
print("2. Individual CSV files for detailed analysis")
print("3. Visual charts for key metrics")
print("\nTotal deliverables: 12+ files covering complete business model analysis")