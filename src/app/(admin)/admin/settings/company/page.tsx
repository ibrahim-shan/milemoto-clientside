'use client';

import { useState } from 'react';

import { Button } from '@/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/ui/Card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

// A simple helper component to keep the form DRY
function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function CompanyPage() {
  // --- Form State ---
  // In a real app, this would come from a query (e.g., TanStack Query)
  const [name, setName] = useState('MileMoto');
  const [email, setEmail] = useState('support@milemoto.com');
  const [phone, setPhone] = useState('+961 1 234 567');
  const [website, setWebsite] = useState('https://milemoto.com');
  const [address, setAddress] = useState('Business Bay');
  const [city, setCity] = useState('Dubai');
  const [state, setState] = useState('Dubai');
  const [zip, setZip] = useState('00000');
  const [country, setCountry] = useState('AE');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  // --- End Form State ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call your API mutation here
    console.log('Saving company details:', {
      name,
      email,
      phone,
      website,
      address,
      city,
      state,
      zip,
      country,
      lat,
      lng,
    });
    // Add toast notification on success
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Column 1 */}
            <div className="space-y-4">
              <FormField
                id="name"
                label="Company Name"
              >
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </FormField>

              <FormField
                id="email"
                label="Public Email"
              >
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </FormField>

              <FormField
                id="phone"
                label="Phone Number"
              >
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </FormField>

              <FormField
                id="website"
                label="Website"
              >
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  id="lat"
                  label="Latitude"
                >
                  <Input
                    id="lat"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    placeholder="e.g., 25.1972"
                  />
                </FormField>
                <FormField
                  id="lng"
                  label="Longitude"
                >
                  <Input
                    id="lng"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    placeholder="e.g., 55.2744"
                  />
                </FormField>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <FormField
                id="address"
                label="Address"
              >
                <Input
                  id="address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street and number"
                />
              </FormField>

              <FormField
                id="city"
                label="City"
              >
                <Input
                  id="city"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  id="state"
                  label="State / Province"
                >
                  <Input
                    id="state"
                    value={state}
                    onChange={e => setState(e.target.value)}
                  />
                </FormField>

                <FormField
                  id="zip"
                  label="Zip / Postal Code"
                >
                  <Input
                    id="zip"
                    value={zip}
                    onChange={e => setZip(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField
                id="country"
                label="Country"
              >
                <Select
                  value={country}
                  onValueChange={setCountry}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AE">United Arab Emirates</SelectItem>
                    <SelectItem value="LB">Lebanon</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    {/* You can add a full country list here later */}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            variant="solid"
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
