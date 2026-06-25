import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Client, Machine, MachineLookupResponse } from "../types/strapi";

type LookupStatus = "idle" | "loading" | "found" | "notFound" | "failed";

type StrapiState = {
  machines: Machine[];
  clients: Client[];
  selectedMachine: Machine | null;
  selectedClient: Client | null;
  serialLookupStatus: LookupStatus;
  serialLookupError: string | null;
  lastSerialQuery: string;
};

const initialState: StrapiState = {
  machines: [],
  clients: [],
  selectedMachine: null,
  selectedClient: null,
  serialLookupStatus: "idle",
  serialLookupError: null,
  lastSerialQuery: "",
};

export const fetchMachineBySerial = createAsyncThunk<
  MachineLookupResponse,
  string,
  { rejectValue: string }
>("strapi/fetchMachineBySerial", async (serial, thunkAPI) => {
  const normalizedSerial = serial.trim();
  const response = await fetch(
    `/api/strapi/machine-by-serial?serial=${encodeURIComponent(normalizedSerial)}`,
  );
  const payload = await response.json();

  if (!response.ok) {
    return thunkAPI.rejectWithValue(payload?.error || "machine_lookup_failed");
  }

  return payload as MachineLookupResponse;
});

const strapiSlice = createSlice({
  name: "strapi",
  initialState,
  reducers: {
    clearMachineLookup(state) {
      state.selectedMachine = null;
      state.selectedClient = null;
      state.serialLookupStatus = "idle";
      state.serialLookupError = null;
      state.lastSerialQuery = "";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMachineBySerial.pending, (state, action) => {
      state.serialLookupStatus = "loading";
      state.serialLookupError = null;
      state.lastSerialQuery = action.meta.arg.trim();
    });
    builder.addCase(fetchMachineBySerial.fulfilled, (state, action) => {
      const { machine, client } = action.payload;

      state.selectedMachine = machine;
      state.selectedClient = client;
      state.machines = machine ? [machine] : [];
      state.clients = client ? [client] : [];
      state.serialLookupStatus = machine ? "found" : "notFound";
      state.serialLookupError = machine ? null : "machine not found";
    });
    builder.addCase(fetchMachineBySerial.rejected, (state, action) => {
      state.selectedMachine = null;
      state.selectedClient = null;
      state.machines = [];
      state.clients = [];
      state.serialLookupStatus = "failed";
      state.serialLookupError = action.payload || "machine lookup failed";
    });
  },
});

export const { clearMachineLookup } = strapiSlice.actions;

export default strapiSlice.reducer;
