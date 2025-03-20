# README

## USAID Tunoze Gusoma Education Application

### Table of Contents
- [Project Brief](#project-brief)
- [Process Flow](#process-flow)
- [Overview](#overview)
- [Program Management](#program-management)
  - [Select Program](#select-program)
  - [Configuring Participant Attributes](#configuring-participant-attributes)
  - [Configuring Filters](#configuring-filters)
- [Activating and Editing Program Stages](#activating-and-editing-program-stages)
  - [Activate Program Stage](#activate-program-stage)
  - [Edit Activated Program Stages](#edit-activated-program-stages)
- [Data Capture and Validation](#data-capture-and-validation)
  - [Capturing Data and Saving It](#capturing-data-and-saving-it)
  - [Validating Data Using Conditions](#validating-data-using-conditions)
- [Advanced Data Management](#advanced-data-management)
  - [Group Action Data Capture](#group-action-data-capture)
  - [Group Action Template](#group-action-template)
    - [Create a Template](#create-a-template)
    - [View Saved Templates](#view-saved-templates)

---

## Project Brief

The **USAID Tunoze Gusoma PPA Beneficiary application** is a tool built on **DHIS2** to track the attendance of training participants. It also records risk assessment results and referrals.

This application enhances data collection and management by leveraging modern web technologies, improving upon the older form-based application released in 2020.

The system operates within **DHIS2 (District Health Information System 2)**, providing real-time tracking of participant data and service provision details.

---

## Process Flow

The application follows a structured workflow that enables efficient program and participant data management.

---

## Overview

Authorized users can access the application from the **DHIS2 installed applications list**. The homepage displays the available **organization units**, allowing users to drill down into the data.

Users can navigate to their desired **organization unit** and select it to access the main workspace.

The **beneficiary list** provides a detailed view of participants enrolled in a specific **program stage**.

---

## Program Management

### Select Program
Users can select a **program** from the drop-down menu on the homepage. This selection determines the available **program stages**.

### Configuring Participant Attributes
Selected attributes will be displayed in the **beneficiary view** on the homepage. It is recommended to keep the list minimal and user-friendly (e.g., displaying only **beneficiary names**).

### Configuring Filters
Filters allow users to group beneficiaries based on program attributes (e.g., **gender, group membership**). Once selected, these filters appear on the homepage.

---

## Activating and Editing Program Stages

### Activate Program Stage
Before capturing data, users must **activate program stages**. Only activated stages will appear in the **program stage drop-down menu**.

To activate a stage:
1. Navigate to the **configuration page**.
2. Select the desired **program stage**.
3. Choose the required **data elements**.
4. Sort the order of data elements.
5. Click **Save** to complete the activation.

### Edit Activated Program Stages
Users can **edit an activated program stage** by selecting **Edit Stage** or **Sort Order** in the configuration page and making necessary adjustments.

---

## Data Capture and Validation

### Capturing Data and Saving It
1. Select the **organization unit**.
2. Choose the **program stage**.
3. Select a **beneficiary** from the list.
4. Capture the necessary data.
5. Click **Save**.

### Validating Data Using Conditions
Users can apply various validation conditions by clicking on the **Eye Icon** next to a data element.

#### Available Conditions:
- **Equals**: Matches an exact value.
- **In-Between**: Checks if the value falls within a specified range.
- **Is_Empty**: Ensures the field is empty or not.
- **Greater_Than**: Ensures the value is above a specific threshold.
- **Less_Than**: Ensures the value is below a specific threshold.

---

## Advanced Data Management

### Group Action Data Capture
Users can apply actions to multiple beneficiaries at once using **Group Action**.

Steps:
1. Select **Group Action** checkbox.
2. Choose the required data.
3. Select the beneficiaries to apply changes to.
4. Click **Save**.

### Group Action Template
Users can save data configurations as **templates** for future use.

#### Create a Template
1. Capture the required data.
2. Click **Create Event Template**.
3. Provide a **name** for the template.
4. Click **Save**.

#### View Saved Templates
1. Open the **template drop-down menu**.
2. Select a **saved template**.
3. Apply it to beneficiaries before saving.

---

## Conclusion
This application enhances **data collection, management, and validation** for the **Tunoze-Gusoma program**, streamlining workflow and improving accuracy. Users should follow the outlined steps to efficiently manage program stages, capture data, and validate inputs.

