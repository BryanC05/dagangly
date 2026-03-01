# Login Troubleshooting Guide: Silent Form Failures

## The Problem
After updating to the new UI, the `Login.tsx` form was failing silently. When a user filled out the email and password fields and clicked the "Masuk" (Login) button, nothing happened. The form did not submit, no API request was sent to the backend, and no error message appeared on the screen or in the browser console.

## The Root Cause
The issue stemmed from an incorrect implementation of React forms using **uncontrolled inputs** alongside custom UI components that were missing `name` attributes.

1. **Uncontrolled Form Data:** The `handleSubmit` function in `Login.tsx` expected to read the form data directly from the DOM using `e.currentTarget`:
   ```javascript
   const email = e.currentTarget.email.value;
   const password = e.currentTarget.password.value;
   ```

2. **Missing Name Attributes:** The custom `<Input />` components being used inside the form only possessed `id`, `type`, and `placeholder` attributes, but lacked `name` attributes:
   ```javascript
   <Input id="email" type="email" placeholder="nama@email.com" required />
   ```

Because standard HTML Forms rely on the `name` attribute to group inputs within the `e.currentTarget` object, React could not find `e.currentTarget.email`. 

When the user clicked "Submit", the code immediately attempted to access `.value` on an `undefined` property (`e.currentTarget.email`). This caused a synchronous `TypeError` inside the Javascript thread before the `api.post` call could ever be executed, causing the login sequence to silently abort.

## The Solution
The correct and more robust approach in modern React development is to use **Controlled Components** with `useState`.

1. **State Initialization:** Define state variables for the form inputs.
   ```javascript
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   ```

2. **Controlled Inputs:** Bind the state to the `value` and `onChange` props of the `<Input />` components. The `name` attributes were also added for standard HTML compliance and accessibility, even though they are no longer strictly required for data extraction when using controlled state.
   ```javascript
   <Input 
     id="email" 
     name="email"
     type="email" 
     value={email}
     onChange={(e) => setEmail(e.target.value)}
     placeholder="nama@email.com" 
     required 
   />
   ```

3. **Form Submission:** Update the `handleSubmit` function to utilize the React state variables instead of interrogating the DOM, and add a quick sanity check.
   ```javascript
   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setLoading(true);
     setError("");

     try {
       if (!email || !password) {
         throw new Error("Tolong isi email dan password.");
       }

       // Safely send the React state variables
       const response = await api.post('/auth/login', { email, password });
       // ... process response ...
     } catch (err: any) {
       // ... display errors ...
     }
   }
   ```

## Results
The custom inputs are now tracked dynamically via React state. Submitting the form cleanly executes the `handleSubmit` block without triggering an `e.currentTarget` DOM error, successfully dispatching the API request to the backend.
