"use client";

import { useEffect, useMemo, useState } from "react";

interface ProfileState {
  age: number | "";
  phone: string;
  preferredCategories: string;
  clothingSizes: string;
}

interface AddressRecord {
  id: string;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const categoryPresets = ["outerwear", "tops", "bottoms", "accessories"];
const sizePresets = ["XS", "S", "M", "L", "XL", "XXL"];

export function AccountDetailsForm() {
  const [profile, setProfile] = useState<ProfileState>({
    age: "",
    phone: "",
    preferredCategories: "",
    clothingSizes: "",
  });

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
    isDefault: false,
  });

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    try {
      const [profileRes, addressesRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/addresses"),
      ]);

      const profilePayload = (await profileRes.json()) as {
        success: boolean;
        data?: {
          age: number | null;
          phone: string | null;
          preferredCategories: string[];
          clothingSizes: string[];
        };
      };

      const addressPayload = (await addressesRes.json()) as {
        success: boolean;
        data?: AddressRecord[];
      };

      if (profilePayload.success && profilePayload.data) {
        setProfile({
          age: profilePayload.data.age ?? "",
          phone: profilePayload.data.phone ?? "",
          preferredCategories: profilePayload.data.preferredCategories.join(", "),
          clothingSizes: profilePayload.data.clothingSizes.join(", "),
        });
      }

      if (addressPayload.success && addressPayload.data) {
        setAddresses(addressPayload.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const profileComplete = useMemo(() => {
    return profile.age !== "" && addresses.length > 0;
  }, [profile.age, addresses.length]);

  async function saveProfile() {
    setProfileMessage(null);

    const payload = {
      age: profile.age === "" ? null : Number(profile.age),
      phone: profile.phone || null,
      preferredCategories: profile.preferredCategories
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
      clothingSizes: profile.clothingSizes
        .split(",")
        .map((entry) => entry.trim().toUpperCase())
        .filter(Boolean),
    };

    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = (await res.json()) as {
      success: boolean;
      error?: { message?: string };
    };

    setProfileMessage(
      response.success ? "Profile saved." : response.error?.message || "Unable to save profile.",
    );
  }

  async function addAddress() {
    setAddressMessage(null);

    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });

    const response = (await res.json()) as {
      success: boolean;
      error?: { message?: string };
    };

    if (!response.success) {
      setAddressMessage(response.error?.message || "Unable to add address.");
      return;
    }

    setAddressForm({
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
      isDefault: false,
    });

    setAddressMessage("Address added.");
    await loadData();
  }

  async function setDefaultAddress(id: string) {
    setAddressMessage(null);

    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });

    const response = (await res.json()) as {
      success: boolean;
      error?: { message?: string };
    };

    if (!response.success) {
      setAddressMessage(response.error?.message || "Unable to update address.");
      return;
    }

    await loadData();
  }

  async function deleteAddress(id: string) {
    setAddressMessage(null);

    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "DELETE",
    });

    const response = (await res.json()) as {
      success: boolean;
      error?: { message?: string };
    };

    if (!response.success) {
      setAddressMessage(response.error?.message || "Unable to delete address.");
      return;
    }

    setAddressMessage("Address removed.");
    await loadData();
  }

  if (loading) {
    return <p className="text-sm uppercase tracking-widest text-muted-foreground">Loading account details...</p>;
  }

  return (
    <div className="space-y-10">
      <section className="border border-border p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-widest">Profile</h2>
          <span className={`text-xs font-bold uppercase tracking-widest ${profileComplete ? "text-emerald-500" : "text-amber-500"}`}>
            {profileComplete ? "Checkout Ready" : "Incomplete"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-widest">Age *</span>
            <input
              type="number"
              min={13}
              max={100}
              value={profile.age}
              onChange={(event) => setProfile((prev) => ({ ...prev, age: event.target.value === "" ? "" : Number(event.target.value) }))}
              className="w-full border border-border px-3 py-2 bg-transparent"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-widest">Phone</span>
            <input
              type="tel"
              value={profile.phone}
              onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
              className="w-full border border-border px-3 py-2 bg-transparent"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs uppercase tracking-widest">Preferred Categories (comma separated)</span>
            <input
              type="text"
              placeholder={categoryPresets.join(", ")}
              value={profile.preferredCategories}
              onChange={(event) => setProfile((prev) => ({ ...prev, preferredCategories: event.target.value }))}
              className="w-full border border-border px-3 py-2 bg-transparent"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs uppercase tracking-widest">Clothing Sizes (comma separated)</span>
            <input
              type="text"
              placeholder={sizePresets.join(", ")}
              value={profile.clothingSizes}
              onChange={(event) => setProfile((prev) => ({ ...prev, clothingSizes: event.target.value }))}
              className="w-full border border-border px-3 py-2 bg-transparent"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void saveProfile()}
          className="bg-foreground text-background px-5 py-3 text-xs font-bold uppercase tracking-widest"
        >
          Save Profile
        </button>

        {profileMessage ? <p className="text-xs uppercase tracking-widest text-muted-foreground">{profileMessage}</p> : null}
      </section>

      <section className="border border-border p-6 space-y-5">
        <h2 className="text-xl font-black uppercase tracking-widest">Shipping Addresses</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Full name *" value={addressForm.fullName} onChange={(event) => setAddressForm((prev) => ({ ...prev, fullName: event.target.value }))} className="border border-border px-3 py-2 bg-transparent" />
          <input placeholder="Phone" value={addressForm.phone} onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))} className="border border-border px-3 py-2 bg-transparent" />
          <input placeholder="Address line 1 *" value={addressForm.line1} onChange={(event) => setAddressForm((prev) => ({ ...prev, line1: event.target.value }))} className="border border-border px-3 py-2 bg-transparent md:col-span-2" />
          <input placeholder="Address line 2" value={addressForm.line2} onChange={(event) => setAddressForm((prev) => ({ ...prev, line2: event.target.value }))} className="border border-border px-3 py-2 bg-transparent md:col-span-2" />
          <input placeholder="City *" value={addressForm.city} onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))} className="border border-border px-3 py-2 bg-transparent" />
          <input placeholder="State *" value={addressForm.state} onChange={(event) => setAddressForm((prev) => ({ ...prev, state: event.target.value }))} className="border border-border px-3 py-2 bg-transparent" />
          <input placeholder="Postal code *" value={addressForm.postalCode} onChange={(event) => setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))} className="border border-border px-3 py-2 bg-transparent" />
          <input placeholder="Country" value={addressForm.country} onChange={(event) => setAddressForm((prev) => ({ ...prev, country: event.target.value.toUpperCase() }))} className="border border-border px-3 py-2 bg-transparent" />
        </div>

        <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
          <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
          Set as default address
        </label>

        <button
          type="button"
          onClick={() => void addAddress()}
          className="bg-foreground text-background px-5 py-3 text-xs font-bold uppercase tracking-widest"
        >
          Add Address
        </button>

        {addressMessage ? <p className="text-xs uppercase tracking-widest text-muted-foreground">{addressMessage}</p> : null}

        <div className="space-y-3">
          {addresses.length === 0 ? (
            <p className="text-xs uppercase tracking-widest text-muted-foreground">No saved addresses yet.</p>
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wide text-sm">
                    {address.fullName} {address.isDefault ? <span className="text-emerald-500">(Default)</span> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}, {address.country}
                  </p>
                  {address.phone ? <p className="text-xs uppercase tracking-widest text-muted-foreground">{address.phone}</p> : null}
                </div>

                <div className="flex gap-2">
                  {!address.isDefault ? (
                    <button type="button" onClick={() => void setDefaultAddress(address.id)} className="border border-border px-3 py-2 text-xs uppercase tracking-widest hover:border-foreground">
                      Make Default
                    </button>
                  ) : null}
                  <button type="button" onClick={() => void deleteAddress(address.id)} className="border border-border px-3 py-2 text-xs uppercase tracking-widest hover:border-foreground">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
