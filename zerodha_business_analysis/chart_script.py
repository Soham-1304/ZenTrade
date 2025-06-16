import pandas as pd
import plotly.graph_objects as go

# Load the data
df = pd.read_csv("zerodha_financial_performance.csv")

# Create simplified year labels for x-axis (within 15 char limit)
df['Year_Short'] = df['Financial Year'].str.replace('FY ', '').str.replace('-', '/')

# Convert values to appropriate units (crores to thousands for abbreviation)
df['Revenue_Display'] = df['Revenue (Rs. Crore)'] / 1000  # Convert to thousands of crores for 'k' display
df['Profit_Display'] = df['Profit After Tax (Rs. Crore)'] / 1000

# Create the chart
fig = go.Figure()

# Add revenue line with trend
fig.add_trace(go.Scatter(
    x=df['Year_Short'], 
    y=df['Revenue_Display'],
    mode='lines+markers',
    name='Revenue',
    line=dict(color='#1FB8CD', width=3),
    marker=dict(size=8),
    cliponaxis=False,
    hovertemplate='Revenue: %{y:.1f}k Cr<extra></extra>'
))

# Add profit line with trend
fig.add_trace(go.Scatter(
    x=df['Year_Short'], 
    y=df['Profit_Display'],
    mode='lines+markers', 
    name='Profit',
    line=dict(color='#FFC185', width=3),
    marker=dict(size=8),
    cliponaxis=False,
    hovertemplate='Profit: %{y:.1f}k Cr<extra></extra>'
))

# Update layout
fig.update_layout(
    title='Zerodha Financial Performance',
    xaxis_title='Financial Year',
    yaxis_title='Amount (₹000 Cr)',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Format y-axis to show values with k suffix
fig.update_yaxes(tickformat='.1f', ticksuffix='k')

# Save the chart
fig.write_image("zerodha_financial_chart.png")