sed -i "s/h.status === 'Approved'/h.status === ('Approved' as any)/g" src/App.tsx
sed -i "s/hostel?.image || hostel?.imageUrl || hostel?.images?.\[0\]/hostel?.image || hostel?.imageUrl || (hostel as any)?.images?.[0]/g" src/components/Page1Public.tsx
sed -i "s/selectedHostel?.image || selectedHostel?.imageUrl || selectedHostel?.images?.\[0\]/selectedHostel?.image || selectedHostel?.imageUrl || (selectedHostel as any)?.images?.[0]/g" src/components/Page1Public.tsx
sed -i "s/Building2, Users/Building2, Users, MapPin/g" src/components/PageManagerDashboard.tsx
