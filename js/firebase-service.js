/**
 * OLYV ATS - Firebase Cloud Integration & Real-Time Sync
 * Connects Olyv ATS with Google Cloud Firestore & Firebase Auth
 */

(function (window) {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyAqp8mSRVGlz9567VcnHT4SajHHLxdlMfI",
    authDomain: "olyv-b55d0.firebaseapp.com",
    projectId: "olyv-b55d0",
    storageBucket: "olyv-b55d0.firebasestorage.app",
    messagingSenderId: "956019051907",
    appId: "1:956019051907:web:2e11f494ebeb872e483ab6",
    measurementId: "G-VC4HJWYKMX"
  };

  class OlyvFirebaseService {
    constructor() {
      this.app = null;
      this.auth = null;
      this.db = null;
      this.currentUser = null;
      this.isOnline = false;
      this.init();
    }

    init() {
      try {
        if (typeof firebase !== 'undefined') {
          this.app = firebase.initializeApp(firebaseConfig);
          this.auth = firebase.auth();
          this.db = firebase.firestore();
          this.isOnline = true;
          this.setupAuthListener();
          this.setupRealtimeListeners();
          console.log('✅ Olyv ATS connected to Firebase Cloud successfully!');
        } else {
          console.warn('Firebase SDK not loaded, operating in local storage mode.');
        }
      } catch (err) {
        console.error('Firebase initialization error:', err);
      }
    }

    setupAuthListener() {
      if (!this.auth) return;
      this.auth.onAuthStateChanged(user => {
        this.currentUser = user;
        this.updateAuthUI(user);
        if (user) {
          this.syncLocalToCloudIfEmpty();
        }
      });
    }

    updateAuthUI(user) {
      const userDisplay = document.getElementById('cloudUserDisplay');
      const userStatusBadge = document.getElementById('cloudSyncStatusBadge');
      const authBtn = document.getElementById('cloudAuthToggleBtn');

      if (user) {
        if (userDisplay) userDisplay.textContent = user.email || 'Recruiter';
        if (userStatusBadge) {
          userStatusBadge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            <span class="text-emerald-300 font-semibold text-[10px]">Cloud Live (${user.email.split('@')[0]})</span>
          `;
        }
        if (authBtn) {
          authBtn.innerHTML = `<span>Logout</span>`;
          authBtn.onclick = () => this.logout();
        }
      } else {
        if (userDisplay) userDisplay.textContent = 'Guest / Offline';
        if (userStatusBadge) {
          userStatusBadge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
            <span class="text-amber-300 font-semibold text-[10px]">Local Mode (Sign in to sync)</span>
          `;
        }
        if (authBtn) {
          authBtn.innerHTML = `<span>Recruiter Login</span>`;
          authBtn.onclick = () => window.OlyvModals.openModal('recruiterAuthModal');
        }
      }
    }

    async login(email, password) {
      if (!this.auth) throw new Error('Firebase Auth not available');
      return await this.auth.signInWithEmailAndPassword(email, password);
    }

    async registerRecruiter(email, password, displayName, role = 'Recruiter') {
      if (!this.auth) throw new Error('Firebase Auth not available');
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      if (cred.user) {
        await cred.user.updateProfile({ displayName });
        // Save recruiter profile in Firestore
        await this.db.collection('recruiters').doc(cred.user.uid).set({
          uid: cred.user.uid,
          email,
          displayName,
          role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      return cred.user;
    }

    async logout() {
      if (this.auth) {
        await this.auth.signOut();
        window.OlyvApp.showToast('Logged out of cloud session', 'info');
      }
    }

    /**
     * Realtime Listeners for Candidates & Positions collections
     */
    setupRealtimeListeners() {
      if (!this.db) return;

      // Listen to Candidates
      this.db.collection('candidates').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const cloudCandidates = [];
          snapshot.forEach(doc => cloudCandidates.push(doc.data()));
          if (window.OlyvDB) {
            window.OlyvDB.data.candidates = cloudCandidates;
            window.OlyvDB.persist();
            if (window.OlyvApp) window.OlyvApp.renderAll();
          }
        }
      }, err => console.warn('Firestore candidates listener error:', err));

      // Listen to Positions
      this.db.collection('positions').onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const cloudPositions = [];
          snapshot.forEach(doc => cloudPositions.push(doc.data()));
          if (window.OlyvDB) {
            window.OlyvDB.data.positions = cloudPositions;
            window.OlyvDB.persist();
            if (window.OlyvApp) window.OlyvApp.renderAll();
          }
        }
      }, err => console.warn('Firestore positions listener error:', err));
    }

    /**
     * Push initial seed data to Cloud Firestore if cloud is empty
     */
    async syncLocalToCloudIfEmpty() {
      if (!this.db) return;
      try {
        const check = await this.db.collection('candidates').limit(1).get();
        if (check.empty && window.OlyvDB && window.OlyvDB.data.candidates.length > 0) {
          console.log('⚡ Populating cloud database with initial ATS data...');
          const batch = this.db.batch();

          window.OlyvDB.data.candidates.forEach(c => {
            const ref = this.db.collection('candidates').doc(c.id);
            batch.set(ref, c);
          });

          window.OlyvDB.data.positions.forEach(p => {
            const ref = this.db.collection('positions').doc(p.id);
            batch.set(ref, p);
          });

          await batch.commit();
          window.OlyvApp.showToast('All candidates and requisitions synced to Cloud Firestore!', 'success');
        }
      } catch (err) {
        console.warn('Initial cloud sync error (check if Firestore is created in Test Mode):', err);
      }
    }

    /**
     * Save/Update Candidate in Cloud
     */
    async saveCandidate(candidate) {
      if (!this.db) return;
      try {
        await this.db.collection('candidates').doc(candidate.id).set(candidate, { merge: true });
      } catch (err) {
        console.error('Error syncing candidate to cloud:', err);
      }
    }

    /**
     * Save/Update Position in Cloud
     */
    async savePosition(position) {
      if (!this.db) return;
      try {
        await this.db.collection('positions').doc(position.id).set(position, { merge: true });
      } catch (err) {
        console.error('Error syncing position to cloud:', err);
      }
    }

    /**
     * Delete Candidate from Cloud
     */
    async deleteCandidate(candidateId) {
      if (!this.db) return;
      try {
        await this.db.collection('candidates').doc(candidateId).delete();
      } catch (err) {
        console.error('Error deleting candidate from cloud:', err);
      }
    }

    /**
     * Delete Position from Cloud
     */
    async deletePosition(positionId) {
      if (!this.db) return;
      try {
        await this.db.collection('positions').doc(positionId).delete();
      } catch (err) {
        console.error('Error deleting position from cloud:', err);
      }
    }
  }

  window.OlyvFirebase = new OlyvFirebaseService();
})(window);
