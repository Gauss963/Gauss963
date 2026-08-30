import matplotlib.pyplot as plt
import numpy as np

incom = [19, 12.5, 10.0, 6.76, 6.4, 4.37, 4.02, 1.33, 0.69]
company_name = ['Napster', 'Tidal', 'Apple Music', 'Youtube Music', 'Deezer', 'Spotify', 'Amazon', 'Pandora Premium', 'Youtube']


x = np.arange(len(incom))
plt.barh(x, incom)
plt.yticks(x, company_name)
plt.xlabel('Average Price Paid Per Thousand Streams (USD)')

plt.savefig("Money_Too_Tight_To_Mention_2018.png" ,  dpi = 900, bbox_inches = 'tight')
plt.savefig("Money_Too_Tight_To_Mention_2018.pdf" ,  dpi = 900, bbox_inches = 'tight')
plt.show()

