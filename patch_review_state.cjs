const fs = require('fs');

let code = fs.readFileSync('src/components/Page1Public.tsx', 'utf8');

const newStates = `
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerToast, setOfferToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
`;

code = code.replace(
  /const \[submittingOffer, setSubmittingOffer\] = useState\(false\);\n\s*const \[offerToast, setOfferToast\] = useState<\{ text: string; type: 'success' \| 'error' \} \| null>\(null\);/m,
  newStates
);

fs.writeFileSync('src/components/Page1Public.tsx', code);
console.log("Patched review states in Page1Public.tsx");
