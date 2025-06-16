import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Load the data
df = pd.read_csv("zerodha_competitive_analysis.csv")

# Display the data to understand structure
print("Data structure:")
print(df.head())
print("\nColumns:")
print(df.columns.tolist())

# Create scatter plot
fig = px.scatter(df, 
                x='Revenue FY24 (Rs. Crore)', 
                y='Active Clients (Million)',
                text='Broker',
                title='Indian Discount Broker Positioning',
                color='Broker',
                size='Revenue FY24 (Rs. Crore)',
                size_max=30,
                color_discrete_sequence=['#1FB8CD', '#FFC185', '#ECEBD5', '#5D878F', '#D2BA4C', '#B4413C'])

# Update layout and styling
fig.update_traces(
    textposition="top center",
    textfont_size=12,
    cliponaxis=False
)

# Update axes with abbreviated labels
fig.update_xaxes(title_text="Revenue (Rs Cr)")
fig.update_yaxes(title_text="Active Clients (M)")

# Update layout
fig.update_layout(
    showlegend=True,
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Save the chart
fig.write_image("broker_positioning_scatter.png")
fig.show()