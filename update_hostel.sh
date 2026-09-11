sed -i 's/currentStep < 10/currentStep < 9/g' src/components/HostelRegistration.tsx
sed -i 's/{ num: 9, title: .Manager.*//g' src/components/HostelRegistration.tsx
sed -i 's/{ num: 10, title: .Review & Submit./{ num: 9, title: '"'Review & Submit'"'/g' src/components/HostelRegistration.tsx
sed -i 's/validateStep(10)/validateStep(9)/g' src/components/HostelRegistration.tsx
sed -i 's/step === 10/step === 9/g' src/components/HostelRegistration.tsx
sed -i 's/currentStep === 10/currentStep === 9/g' src/components/HostelRegistration.tsx
sed -i 's/Step 10: /Step 9: /g' src/components/HostelRegistration.tsx
