import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Load the data
df = pd.read_csv('zerodha_revenue_streams.csv')

# Create abbreviated labels to fit 15 character limit
df['Short_Label'] = df['Revenue Stream'].replace({
    'Equity Intraday Brokerage': 'Equity Intraday',
    'F&O Trading Brokerage': 'F&O Trading', 
    'Currency & Commodity Brokerage': 'Currency & Comm',
    'Exchange Rebates': 'Exchange Rebates',
    'Interest on Client Funds': 'Interest on Funds',
    'Account Maintenance Charges': 'Account Maint',
    'DP Charges': 'DP Charges',
    'Other Income': 'Other Income'
})

# Define the brand colors
colors = ['#1FB8CD', '#FFC185', '#ECEBD5', '#5D878F', '#D2BA4C', '#B4413C', '#964325', '#944454']

# Create pie chart
fig = go.Figure(data=[go.Pie(
    labels=df['Short_Label'],
    values=df['Percentage of Total Revenue (%)'],
    textinfo='label+percent',
    textposition='inside',
    marker=dict(colors=colors[:len(df)]),
    hovertemplate='<b>%{label}</b><br>%{percent}<br>Rs. %{customdata} Cr<extra></extra>',
    customdata=df['FY2024 Revenue (Rs. Crore)']
)])

# Update layout following pie chart specific instructions
fig.update_layout(
    title='Zerodha Revenue Breakdown FY2024',
    uniformtext_minsize=14, 
    uniformtext_mode='hide'
)

# Save the chart
fig.write_image('zerodha_revenue_breakdown.png')
print("Chart saved successfully!")