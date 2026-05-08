import pickle

with open('meta_learner_model (1).pkl', 'rb') as f:
    model = pickle.load(f)
    print("Meta Learner n_features_in_:", getattr(model, 'n_features_in_', 'N/A'))
